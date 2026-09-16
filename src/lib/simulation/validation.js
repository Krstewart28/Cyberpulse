// Event validation — runs before the detection engine. Invalid events are recorded, not processed.
import { EMPLOYEES } from "./fictionalData";

export const VALID_EVENT_TYPES = new Set([
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "LOGOUT",
  "APPLICATION_ACCESS",
  "ACCESS_DENIED",
  "FILE_ACCESS",
  "PASSWORD_CHANGE",
  "ACCOUNT_LOCKED",
  "ROLE_CHANGE",
  "PERMISSION_CHANGE",
  "ADMIN_LOGIN",
  "SESSION_CREATED",
  "SESSION_EXPIRED",
]);

export function validateEvent(event, knownEventIds) {
  const errors = [];

  if (!event.event_id) {
    errors.push("Missing event ID");
  } else if (knownEventIds && knownEventIds.has(event.event_id)) {
    errors.push(`Duplicate event ID: ${event.event_id}`);
  }

  if (!event.user) {
    errors.push("Missing user");
  } else if (!EMPLOYEES.some((e) => e.user_id === event.user)) {
    errors.push(`Invalid user reference: ${event.user}`);
  }

  if (!event.timestamp) {
    errors.push("Missing timestamp");
  } else if (Number.isNaN(new Date(event.timestamp).getTime())) {
    errors.push("Invalid timestamp");
  }

  if (!event.event_type) {
    errors.push("Missing event type");
  } else if (!VALID_EVENT_TYPES.has(event.event_type)) {
    errors.push(`Invalid event type: ${event.event_type}`);
  }

  if (!event.application) {
    errors.push("Missing application");
  }

  return { valid: errors.length === 0, errors };
}