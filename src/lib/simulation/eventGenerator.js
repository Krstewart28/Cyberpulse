// Synthetic security-event generator. Produces mostly normal enterprise activity,
// with occasional suspicious bursts that may trigger detection rules.
import { EMPLOYEES, APPLICATIONS, lookup } from "./fictionalData";

const NORMAL_TYPES = [
  { type: "LOGIN_SUCCESS", weight: 18, result: "success" },
  { type: "LOGOUT", weight: 13, result: "success" },
  { type: "APPLICATION_ACCESS", weight: 20, result: "success" },
  { type: "FILE_ACCESS", weight: 11, result: "success" },
  { type: "SESSION_CREATED", weight: 9, result: "success" },
  { type: "SESSION_EXPIRED", weight: 7, result: "info" },
  { type: "LOGIN_FAILURE", weight: 6, result: "failure" },
  { type: "ACCESS_DENIED", weight: 3, result: "denied" },
  { type: "PASSWORD_CHANGE", weight: 2, result: "success" },
  { type: "ADMIN_LOGIN", weight: 2, result: "success" },
];

const DEVICES = [
  "WIN-LPT-4421", "MAC-DSK-8830", "WIN-DSK-7712", "MBP-SEC-2210",
  "LNX-SRV-0192", "WIN-DSK-5588", "MBP-ENG-3344", "LNX-OPS-6677",
];
const IP_PREFIXES = ["10.12", "10.15", "172.16.10", "192.168.10"];

let eventCounter = 1000;
export function nextEventId() {
  eventCounter += 1;
  return `EVT-${String(eventCounter).padStart(6, "0")}`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIp() {
  return `${pick(IP_PREFIXES)}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
}

function weightedType() {
  const total = NORMAL_TYPES.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of NORMAL_TYPES) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return NORMAL_TYPES[0];
}

function describe(type, emp, app, result) {
  switch (type) {
    case "LOGIN_SUCCESS":
      return `${emp.name} successfully authenticated to ${app}`;
    case "LOGIN_FAILURE":
      return `Failed authentication attempt for ${emp.name} on ${app}`;
    case "LOGOUT":
      return `${emp.name} logged out of ${app}`;
    case "APPLICATION_ACCESS":
      return `${emp.name} accessed ${app}`;
    case "ACCESS_DENIED":
      return `Access to ${app} denied for ${emp.name} (not authorized)`;
    case "FILE_ACCESS":
      return `${emp.name} opened a file on ${app}`;
    case "PASSWORD_CHANGE":
      return `${emp.name} changed account password on ${app}`;
    case "ACCOUNT_LOCKED":
      return `Account ${emp.name} locked on ${app}`;
    case "ROLE_CHANGE":
      return `Role modified for ${emp.name} on ${app}`;
    case "PERMISSION_CHANGE":
      return `Permissions modified for ${emp.name} on ${app}`;
    case "ADMIN_LOGIN":
      return `${emp.name} signed in to administrative console of ${app}`;
    case "SESSION_CREATED":
      return `New session created for ${emp.name} on ${app}`;
    case "SESSION_EXPIRED":
      return `Session for ${emp.name} on ${app} expired`;
    default:
      return `${emp.name} - ${type} on ${app}`;
  }
}

function makeEvent(simTime, emp, app, type, result) {
  return {
    event_id: nextEventId(),
    timestamp: new Date(simTime).toISOString(),
    user: emp.user_id,
    user_name: emp.name,
    department: emp.department,
    source_ip: randomIp(),
    device: pick(DEVICES),
    application: app,
    event_type: type,
    result,
    description: describe(type, emp, app, result),
    is_valid: true,
    validation_error: "",
  };
}

export function generateNormalEvent(simTime) {
  const emp = pick(EMPLOYEES);
  let app;
  if (Math.random() < 0.88 && emp.assigned_applications.length) {
    app = pick(emp.assigned_applications);
  } else {
    app = pick(APPLICATIONS).name;
  }
  const t = weightedType();
  let type = t.type;
  let result = t.result;

  if (type === "ACCESS_DENIED" && emp.assigned_applications.includes(app)) {
    const notAssigned = APPLICATIONS.map((a) => a.name).filter((a) => !emp.assigned_applications.includes(a));
    if (notAssigned.length) app = pick(notAssigned);
  }
  if (type === "ADMIN_LOGIN" && emp.privilege_level === "standard") {
    type = "LOGIN_SUCCESS";
    result = "success";
  }
  return makeEvent(simTime, emp, app, type, result);
}

// Suspicious scenarios. Each returns a list of events with preset timestamps.
function addMinutes(date, min) {
  return new Date(new Date(date).getTime() + min * 60000);
}
function setHour(date, h, m = 0) {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function bruteForceScenario(simTime) {
  const emp = pick(EMPLOYEES);
  const app = pick(emp.assigned_applications.length ? emp.assigned_applications : APPLICATIONS.map((a) => a.name));
  const events = [];
  let t = new Date(simTime);
  const n = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i++) {
    events.push(makeEvent(t, emp, app, "LOGIN_FAILURE", "failure"));
    t = addMinutes(t, 1);
  }
  if (Math.random() < 0.5) {
    events.push(makeEvent(t, emp, app, "LOGIN_SUCCESS", "success"));
  }
  return events;
}

function unusualTimeScenario(simTime) {
  const dayShift = EMPLOYEES.filter((e) => e.typical_login_hour !== 0);
  const emp = pick(dayShift);
  const app = pick(emp.assigned_applications.length ? emp.assigned_applications : ["Employee Portal"]);
  const t = setHour(simTime, 2, 30 + Math.floor(Math.random() * 30));
  const type = pick(["LOGIN_SUCCESS", "APPLICATION_ACCESS", "FILE_ACCESS"]);
  return [makeEvent(t, emp, app, type, "success")];
}

function permissionChangeScenario(simTime) {
  const emp = pick(EMPLOYEES.filter((e) => e.privilege_level !== "standard"));
  const app = pick(["Administrative Console", "Financial Database", "HR System"]);
  const events = [];
  let t = new Date(simTime);
  if (Math.random() < 0.5) {
    events.push(makeEvent(t, emp, app, "ADMIN_LOGIN", "success"));
    t = addMinutes(t, 2);
  }
  events.push(makeEvent(t, emp, app, pick(["PERMISSION_CHANGE", "ROLE_CHANGE"]), "success"));
  return events;
}

function accessDenialsScenario(simTime) {
  const emp = pick(EMPLOYEES);
  const notAssigned = APPLICATIONS.map((a) => a.name).filter((a) => !emp.assigned_applications.includes(a));
  const app = pick(notAssigned.length ? notAssigned : ["Financial Database"]);
  const events = [];
  let t = new Date(simTime);
  for (let i = 0; i < 3; i++) {
    events.push(makeEvent(t, emp, app, "ACCESS_DENIED", "denied"));
    t = addMinutes(t, 1);
  }
  return events;
}

function sensitiveAppScenario(simTime) {
  const emp = pick(EMPLOYEES);
  const app = pick(["Payment System", "Financial Database", "Administrative Console"]);
  const events = [];
  let t = new Date(simTime);
  // a couple of failures on a sensitive asset, then an access attempt
  for (let i = 0; i < 2; i++) {
    events.push(makeEvent(t, emp, app, "LOGIN_FAILURE", "failure"));
    t = addMinutes(t, 2);
  }
  events.push(makeEvent(t, emp, app, "APPLICATION_ACCESS", "success"));
  return events;
}

const SCENARIOS = [bruteForceScenario, unusualTimeScenario, permissionChangeScenario, accessDenialsScenario, sensitiveAppScenario];

export function generateScenario(simTime) {
  const fn = pick(SCENARIOS);
  return fn(simTime);
}

// Deterministic demo scenario: 4 failed logins followed by a successful login
// for one user on one application — guaranteed to trigger rule R001 and let the
// successful login correlate into the same alert.
export function buildBruteForceDemo(simTime) {
  const emp = pick(EMPLOYEES);
  const app = pick(emp.assigned_applications.length ? emp.assigned_applications : APPLICATIONS.map((a) => a.name));
  const events = [];
  let t = new Date(simTime);
  for (let i = 0; i < 4; i++) {
    events.push(makeEvent(t, emp, app, "LOGIN_FAILURE", "failure"));
    t = addMinutes(t, 1);
  }
  events.push(makeEvent(t, emp, app, "LOGIN_SUCCESS", "success"));
  return events;
}

// Occasionally produce a deliberately invalid event to exercise validation.
export function maybeCorruptEvent(event, knownEventIds) {
  const mode = Math.floor(Math.random() * 3);
  const corrupted = { ...event };
  if (mode === 0) {
    delete corrupted.user;
  } else if (mode === 1) {
    corrupted.event_type = "BAD_EVENT_TYPE";
  } else {
    // duplicate an existing id
    const ids = Array.from(knownEventIds || []);
    if (ids.length) corrupted.event_id = pick(ids);
  }
  corrupted.is_valid = false;
  return corrupted;
}