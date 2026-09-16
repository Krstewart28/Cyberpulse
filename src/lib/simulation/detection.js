// Rule-based detection engine. Explainable, deterministic — no black box.
// Evaluates a new event against a sliding window of recent events for the same user.
import { calculateRisk } from "./riskScoring";
import { lookup } from "./fictionalData";

const FIVE_MIN = 5 * 60 * 1000;
const TEN_MIN = 10 * 60 * 1000;
const SIX_HOURS = 6 * 60 * 60 * 1000;

function ts(e) {
  return new Date(e.timestamp).getTime();
}

function recentForUser(events, userId, ms, now) {
  return events.filter((e) => e.user === userId && now - ts(e) >= 0 && now - ts(e) <= ms);
}

function isUnusualTime(user, eventTime) {
  if (!user) return false;
  const lh = user.typical_login_hour;
  const loh = user.typical_logout_hour;
  if (lh === 0 && loh === 24) return false; // 24/7 schedule
  const h = new Date(eventTime).getHours();
  return h < lh - 1 || h >= loh + 1;
}

function buildAlert({ rule, event, user, app, related, explanation, risk }) {
  return {
    alert_id: "",
    title: rule.name,
    type: rule.name,
    rule_id: rule.rule_id,
    status: "NEW",
    severity: rule.severity,
    risk_score: risk.score,
    risk_category: risk.category,
    risk_breakdown: risk.breakdown,
    user: event.user,
    user_name: event.user_name || event.user,
    department: event.department,
    privilege_level: user?.privilege_level || "standard",
    application: event.application,
    asset_criticality: app?.business_criticality || "Unknown",
    source_ip: event.source_ip,
    detection_explanation: explanation,
    related_event_ids: related,
    event_count: related.length,
    timestamp: event.timestamp,
  };
}

// state: { throttle: Map<ruleId:userId, timestampMs>, alertCounter: number }
export function evaluateEvent(event, events, rules, state) {
  const alerts = [];
  const now = ts(event);
  const user = lookup.employee(event.user);
  const app = lookup.application(event.application);
  const enabled = rules.filter((r) => r.enabled);

  const tkey = (ruleId, userId) => `${ruleId}:${userId}`;
  const throttled = (ruleId, userId, window = TEN_MIN) => {
    const last = state.throttle.get(tkey(ruleId, userId)) || 0;
    return now - last < window;
  };
  const markThrottle = (ruleId, userId) => state.throttle.set(tkey(ruleId, userId), now);
  const nextAlertId = () => {
    state.alertCounter += 1;
    return `ALT-${String(state.alertCounter).padStart(6, "0")}`;
  };

  // R001 Repeated Authentication Failures
  const r001 = enabled.find((r) => r.rule_id === "R001");
  if (r001 && event.event_type === "LOGIN_FAILURE") {
    const fails = recentForUser(events, event.user, FIVE_MIN, now).filter((e) => e.event_type === "LOGIN_FAILURE");
    if (fails.length >= 3 && !throttled("R001", event.user)) {
      const related = fails.map((e) => e.event_id);
      const success = recentForUser(events, event.user, FIVE_MIN, now).find((e) => e.event_type === "LOGIN_SUCCESS");
      if (success && !related.includes(success.event_id)) related.push(success.event_id);
      const risk = calculateRisk({ rule: r001, asset: app, user, unusualTime: isUnusualTime(user, now), correlatedCount: related.length });
      alerts.push(
        buildAlert({
          rule: r001,
          event,
          user,
          app,
          related,
          explanation: `${fails.length} failed login attempts for ${event.user_name} within 5 minutes from source ${event.source_ip}. A single failed login is normal, but this concentration may indicate a brute-force or credential-stuffing attempt and warrants analyst review.`,
          risk,
        })
      );
      markThrottle("R001", event.user);
    }
  }

  // R002 Unusual Access Time
  const r002 = enabled.find((r) => r.rule_id === "R002");
  if (r002 && !throttled("R002", event.user, SIX_HOURS)) {
    if (isUnusualTime(user, now) && ["LOGIN_SUCCESS", "APPLICATION_ACCESS", "ADMIN_LOGIN", "FILE_ACCESS"].includes(event.event_type)) {
      const risk = calculateRisk({ rule: r002, asset: app, user, unusualTime: true, correlatedCount: 1 });
      alerts.push(
        buildAlert({
          rule: r002,
          event,
          user,
          app,
          related: [event.event_id],
          explanation: `${event.user_name} accessed ${event.application} at ${new Date(event.timestamp).toLocaleTimeString()}, which is outside their typical schedule (${user.typical_login_hour}:00–${user.typical_logout_hour}:00). This is flagged as unusual, not malicious — legitimate off-hours work is common and an analyst should confirm whether it was expected.`,
          risk,
        })
      );
      markThrottle("R002", event.user);
    }
  }

  // R003 Significant Permission Change
  const r003 = enabled.find((r) => r.rule_id === "R003");
  if (r003 && (event.event_type === "ROLE_CHANGE" || event.event_type === "PERMISSION_CHANGE")) {
    const related = [event.event_id];
    const adminLogin = recentForUser(events, event.user, TEN_MIN, now).find((e) => e.event_type === "ADMIN_LOGIN");
    if (adminLogin) related.push(adminLogin.event_id);
    const escalated = user?.privilege_level === "admin" || user?.privilege_level === "elevated" || app?.business_criticality === "Critical";
    const ruleWithSev = { ...r003, severity: escalated ? "High" : "Medium" };
    const risk = calculateRisk({ rule: ruleWithSev, asset: app, user, unusualTime: isUnusualTime(user, now), correlatedCount: related.length });
    alerts.push(
      buildAlert({
        rule: ruleWithSev,
        event,
        user,
        app,
        related,
        explanation: `A ${event.event_type.toLowerCase().replace("_", " ")} was applied to ${event.user_name} on ${event.application}. Permission changes are sensitive${
          escalated ? ", and this one involves a privileged account or critical asset, raising its importance" : ""
        }. An analyst should verify the change was authorized and properly requested.`,
        risk,
      })
    );
  }

  // R004 Repeated Access Denials
  const r004 = enabled.find((r) => r.rule_id === "R004");
  if (r004 && event.event_type === "ACCESS_DENIED") {
    const denied = recentForUser(events, event.user, FIVE_MIN, now).filter((e) => e.event_type === "ACCESS_DENIED");
    if (denied.length >= 3 && !throttled("R004", event.user)) {
      const related = denied.map((e) => e.event_id);
      const risk = calculateRisk({ rule: r004, asset: app, user, unusualTime: isUnusualTime(user, now), correlatedCount: related.length });
      alerts.push(
        buildAlert({
          rule: r004,
          event,
          user,
          app,
          related,
          explanation: `${denied.length} access-denial events for ${event.user_name} on ${event.application} within 5 minutes. ${event.user_name} is not authorized for this application. A cluster of denials may indicate probing or an attempted privilege escalation and should be reviewed.`,
          risk,
        })
      );
      markThrottle("R004", event.user);
    }
  }

  // R005 Sensitive Application Activity
  const r005 = enabled.find((r) => r.rule_id === "R005");
  if (r005 && app && (app.business_criticality === "High" || app.business_criticality === "Critical") && !throttled("R005", event.user)) {
    const fails = recentForUser(events, event.user, TEN_MIN, now).filter((e) => e.event_type === "LOGIN_FAILURE").length;
    const deniedCount = recentForUser(events, event.user, TEN_MIN, now).filter((e) => e.event_type === "ACCESS_DENIED").length;
    const unusual = isUnusualTime(user, now);
    const combinedSignal = fails >= 2 || deniedCount >= 1 || unusual || event.result === "failure" || event.result === "denied";
    // Avoid duplicating an alert already raised this tick by R001/R004 on the same event
    const alreadyAlerted = alerts.some((a) => a.user === event.user && (a.rule_id === "R001" || a.rule_id === "R004"));
    if (combinedSignal && !alreadyAlerted) {
      const related = [event.event_id];
      const risk = calculateRisk({ rule: r005, asset: app, user, unusualTime: unusual, correlatedCount: related.length });
      const signals = [];
      if (unusual) signals.push("off-schedule access");
      if (fails >= 2) signals.push(`${fails} recent failed logins`);
      if (deniedCount >= 1) signals.push(`${deniedCount} recent access denials`);
      if (event.result === "failure" || event.result === "denied") signals.push(`a ${event.result} result`);
      alerts.push(
        buildAlert({
          rule: r005,
          event,
          user,
          app,
          related,
          explanation: `Activity on the ${app.business_criticality.toLowerCase()}-criticality asset "${event.application}" by ${event.user_name} was combined with another suspicious signal (${signals.join(", ")}). Sensitive assets receive heightened scrutiny when secondary indicators are present.`,
          risk,
        })
      );
      markThrottle("R005", event.user);
    }
  }

  // Assign alert ids
  alerts.forEach((a) => (a.alert_id = nextAlertId()));
  return alerts;
}