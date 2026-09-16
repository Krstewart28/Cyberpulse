import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { generateNormalEvent, generateScenario, maybeCorruptEvent, nextEventId, buildBruteForceDemo } from "@/lib/simulation/eventGenerator";
import { validateEvent } from "@/lib/simulation/validation";
import { evaluateEvent } from "@/lib/simulation/detection";
import { DETECTION_RULES, EMPLOYEES, APPLICATIONS, DEPARTMENTS, lookup } from "@/lib/simulation/fictionalData";

const SimulationContext = createContext(null);

const TICK_MS = 1100;
const PERSIST_MS = 4000;
const MAX_EVENTS_IN_MEMORY = 400;
const MAX_ALERTS_IN_MEMORY = 150;

export function SimulationProvider({ children }) {
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState([]); // most recent first
  const [alerts, setAlerts] = useState([]); // most recent first
  const [stats, setStats] = useState({
    eventsGenerated: 0,
    eventsProcessed: 0,
    eventsRejected: 0,
    alertsGenerated: 0,
    openAlerts: 0,
    highRiskAlerts: 0,
    criticalAlerts: 0,
    bySeverity: { Low: 0, Medium: 0, High: 0, Critical: 0 },
    byType: {},
  });
  const [simTime, setSimTime] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  });
  const [rules, setRules] = useState(DETECTION_RULES);
  const [seeding, setSeeding] = useState(true);

  // refs for the live pipeline (avoid re-render churn)
  const eventsRef = useRef([]); // chronological (oldest first)
  const alertsRef = useRef([]); // newest first
  const knownEventIds = useRef(new Set());
  const throttleState = useRef({ throttle: new Map(), alertCounter: 0 });
  const simTimeRef = useRef(new Date(simTime));
  const runningRef = useRef(false);
  const tickRef = useRef(null);
  const persistRef = useRef(null);
  const scenarioQueue = useRef([]);
  const pendingEvents = useRef([]);
  const pendingAlerts = useRef([]);
  const pendingEventUpdates = useRef([]); // {event_id, alert_id}
  const pendingAlertUpdates = useRef([]); // {alert_id, related_event_ids, event_count}
  const eventIdToEntity = useRef(new Map());
  const alertIdToEntity = useRef(new Map());

  // Seed reference data (departments, employees, applications, rules) if DB is empty.
  const seedIfEmpty = useCallback(async () => {
    try {
      const existingRules = await base44.entities.DetectionRule.list();
      if (existingRules && existingRules.length > 0) {
        setRules(existingRules);
        return;
      }
      await base44.entities.Department.bulkCreate(DEPARTMENTS);
      await base44.entities.Employee.bulkCreate(EMPLOYEES);
      await base44.entities.Application.bulkCreate(APPLICATIONS);
      const createdRules = await base44.entities.DetectionRule.bulkCreate(DETECTION_RULES);
      setRules(createdRules || DETECTION_RULES);
    } catch (e) {
      // fall back to in-memory rules
      setRules(DETECTION_RULES);
    } finally {
      setSeeding(false);
    }
  }, []);

  useEffect(() => {
    seedIfEmpty();
  }, [seedIfEmpty]);

  const computeStats = useCallback(() => {
    const al = alertsRef.current;
    const bySeverity = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    const byType = {};
    let openAlerts = 0;
    let highRisk = 0;
    let critical = 0;
    for (const a of al) {
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
      byType[a.type] = (byType[a.type] || 0) + 1;
      if (a.status !== "RESOLVED") openAlerts += 1;
      if (a.risk_score >= 50) highRisk += 1;
      if (a.risk_score >= 75) critical += 1;
    }
    setStats((s) => ({
      ...s,
      openAlerts,
      highRiskAlerts: highRisk,
      criticalAlerts: critical,
      bySeverity,
      byType,
      alertsGenerated: al.length,
    }));
  }, []);

  const pushEvent = useCallback((event) => {
    eventsRef.current.push(event);
    if (eventsRef.current.length > MAX_EVENTS_IN_MEMORY) {
      eventsRef.current.splice(0, eventsRef.current.length - MAX_EVENTS_IN_MEMORY);
    }
    knownEventIds.current.add(event.event_id);
    pendingEvents.current.push(event);
  }, []);

  const pushAlert = useCallback((alert) => {
    alertsRef.current.unshift(alert);
    if (alertsRef.current.length > MAX_ALERTS_IN_MEMORY) {
      alertsRef.current.length = MAX_ALERTS_IN_MEMORY;
    }
    pendingAlerts.current.push(alert);
    // link related events
    for (const eid of alert.related_event_ids) {
      const evt = eventsRef.current.find((e) => e.event_id === eid);
      if (evt) evt.alert_id = alert.alert_id;
      if (eventIdToEntity.current.has(eid)) {
        pendingEventUpdates.current.push({ event_id: eid, alert_id: alert.alert_id });
      }
    }
  }, []);

  // Correlate a late LOGIN_SUCCESS into an existing open R001 alert for the user.
  const maybeCorrelateSuccess = useCallback((event) => {
    if (event.event_type !== "LOGIN_SUCCESS" || !event.is_valid) return;
    const now = new Date(event.timestamp).getTime();
    const target = alertsRef.current.find(
      (a) => a.rule_id === "R001" && a.user === event.user && a.status !== "RESOLVED" && now - new Date(a.timestamp).getTime() < 10 * 60 * 1000
    );
    if (target && !target.related_event_ids.includes(event.event_id)) {
      target.related_event_ids.push(event.event_id);
      target.event_count = target.related_event_ids.length;
      event.alert_id = target.alert_id;
      pendingAlertUpdates.current.push({
        alert_id: target.alert_id,
        related_event_ids: target.related_event_ids,
        event_count: target.event_count,
      });
      if (eventIdToEntity.current.has(event.event_id)) {
        pendingEventUpdates.current.push({ event_id: event.event_id, alert_id: target.alert_id });
      }
    }
  }, []);

  // Shared pipeline step: validate → detect → correlate. Returns any alerts created.
  const processEvent = useCallback((event) => {
    setStats((s) => ({ ...s, eventsGenerated: s.eventsGenerated + 1 }));
    const { valid, errors } = validateEvent(event, knownEventIds.current);
    if (!valid) {
      pushEvent({ ...event, is_valid: false, validation_error: errors.join("; ") });
      setStats((s) => ({ ...s, eventsRejected: s.eventsRejected + 1 }));
      return [];
    }
    const validEvent = { ...event, is_valid: true, validation_error: "" };
    pushEvent(validEvent);
    setStats((s) => ({ ...s, eventsProcessed: s.eventsProcessed + 1 }));
    const newAlerts = evaluateEvent(validEvent, eventsRef.current, rules, throttleState.current);
    for (const a of newAlerts) {
      pushAlert(a);
    }
    maybeCorrelateSuccess(validEvent);
    return newAlerts;
  }, [rules, pushEvent, pushAlert, maybeCorrelateSuccess]);

  const tick = useCallback(() => {
    // advance simulated clock
    simTimeRef.current = new Date(simTimeRef.current.getTime() + (1 + Math.floor(Math.random() * 4)) * 60000);
    setSimTime(simTimeRef.current.toISOString());

    let event;
    if (scenarioQueue.current.length > 0) {
      event = scenarioQueue.current.shift();
      // scenario events use their own preset timestamps; align sim clock to the last one
      simTimeRef.current = new Date(event.timestamp);
    } else if (Math.random() < 0.16) {
      const scenario = generateScenario(simTimeRef.current);
      scenarioQueue.current = scenario.slice(1);
      event = scenario[0];
      simTimeRef.current = new Date(event.timestamp);
    } else {
      event = generateNormalEvent(simTimeRef.current);
      // occasionally corrupt a normal event to exercise validation
      if (Math.random() < 0.04) {
        event = maybeCorruptEvent(event, knownEventIds.current);
      }
    }

    processEvent(event);

    // mirror to state (sliced, newest first)
    setEvents([...eventsRef.current].reverse().slice(0, 200));
    setAlerts([...alertsRef.current]);
    computeStats();
  }, [processEvent, computeStats]);

  const persist = useCallback(async () => {
    try {
      if (pendingEvents.current.length) {
        const batch = pendingEvents.current.splice(0);
        const created = await base44.entities.SecurityEvent.bulkCreate(batch);
        if (Array.isArray(created)) {
          for (const rec of created) {
            if (rec.event_id) eventIdToEntity.current.set(rec.event_id, rec.id);
          }
        }
      }
      if (pendingAlerts.current.length) {
        const batch = pendingAlerts.current.splice(0);
        const created = await base44.entities.Alert.bulkCreate(batch);
        if (Array.isArray(created)) {
          for (const rec of created) {
            if (rec.alert_id) alertIdToEntity.current.set(rec.alert_id, rec.id);
          }
        }
      }
      if (pendingEventUpdates.current.length) {
        const updates = pendingEventUpdates.current.splice(0);
        const payload = [];
        for (const u of updates) {
          const id = eventIdToEntity.current.get(u.event_id);
          if (id) payload.push({ id, alert_id: u.alert_id });
        }
        if (payload.length) await base44.entities.SecurityEvent.bulkUpdate(payload);
      }
      if (pendingAlertUpdates.current.length) {
        const updates = pendingAlertUpdates.current.splice(0);
        for (const u of updates) {
          const id = alertIdToEntity.current.get(u.alert_id);
          if (id) await base44.entities.Alert.update(id, { related_event_ids: u.related_event_ids, event_count: u.event_count });
        }
      }
    } catch (e) {
      // persistence errors shouldn't crash the simulation
    }
  }, []);

  // Inject a guaranteed brute-force scenario: 4 failed logins then a successful
  // login, processed synchronously through the same pipeline as live events.
  const triggerAttackDemo = useCallback(() => {
    const scenario = buildBruteForceDemo(simTimeRef.current);
    let created = [];
    for (const ev of scenario) {
      created = created.concat(processEvent(ev));
      simTimeRef.current = new Date(ev.timestamp);
    }
    setSimTime(simTimeRef.current.toISOString());
    setEvents([...eventsRef.current].reverse().slice(0, 200));
    setAlerts([...alertsRef.current]);
    computeStats();
    persist();
    return created;
  }, [processEvent, computeStats, persist]);

  const start = useCallback(() => {
    if (runningRef.current || seeding) return;
    runningRef.current = true;
    setRunning(true);
    tickRef.current = setInterval(tick, TICK_MS);
    persistRef.current = setInterval(persist, PERSIST_MS);
  }, [tick, persist, seeding]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (tickRef.current) clearInterval(tickRef.current);
    if (persistRef.current) clearInterval(persistRef.current);
    tickRef.current = null;
    persistRef.current = null;
    persist(); // flush remaining
  }, [persist]);

  const reset = useCallback(async () => {
    stop();
    try {
      await base44.entities.SecurityEvent.deleteMany({});
      await base44.entities.Alert.deleteMany({});
    } catch (e) {
      // ignore
    }
    eventsRef.current = [];
    alertsRef.current = [];
    knownEventIds.current = new Set();
    throttleState.current = { throttle: new Map(), alertCounter: 0 };
    scenarioQueue.current = [];
    pendingEvents.current = [];
    pendingAlerts.current = [];
    pendingEventUpdates.current = [];
    pendingAlertUpdates.current = [];
    eventIdToEntity.current = new Map();
    alertIdToEntity.current = new Map();
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    simTimeRef.current = d;
    setSimTime(d.toISOString());
    setEvents([]);
    setAlerts([]);
    setStats({
      eventsGenerated: 0,
      eventsProcessed: 0,
      eventsRejected: 0,
      alertsGenerated: 0,
      openAlerts: 0,
      highRiskAlerts: 0,
      criticalAlerts: 0,
      bySeverity: { Low: 0, Medium: 0, High: 0, Critical: 0 },
      byType: {},
    });
  }, [stop]);

  const updateAlertStatus = useCallback(async (alertId, status) => {
    const a = alertsRef.current.find((x) => x.alert_id === alertId);
    if (a) a.status = status;
    setAlerts([...alertsRef.current]);
    computeStats();
    const entityId = alertIdToEntity.current.get(alertId);
    if (entityId) {
      try {
        await base44.entities.Alert.update(entityId, { status });
      } catch (e) {
        // ignore
      }
    }
  }, [computeStats]);

  const reloadRules = useCallback(async () => {
    try {
      const r = await base44.entities.DetectionRule.list();
      if (r && r.length) setRules(r);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (persistRef.current) clearInterval(persistRef.current);
    };
  }, []);

  const value = {
    running,
    seeding,
    events,
    alerts,
    stats,
    simTime,
    rules,
    start,
    stop,
    reset,
    updateAlertStatus,
    reloadRules,
    triggerAttackDemo,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}