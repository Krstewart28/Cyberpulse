// Fictional enterprise data for CyberPulse. All users, IPs, devices, and assets are simulated.

export const DEPARTMENTS = [
  { name: "Technology", description: "Software, infrastructure and platform engineering" },
  { name: "Finance", description: "Accounting, payments and financial reporting" },
  { name: "Human Resources", description: "Employee lifecycle and workforce systems" },
  { name: "Operations", description: "Facilities, logistics and internal operations" },
  { name: "Customer Support", description: "Customer-facing support and service desk" },
  { name: "Cybersecurity", description: "Security operations and risk management" },
];

export const APPLICATIONS = [
  { name: "Customer Portal", description: "External customer self-service portal", business_criticality: "High" },
  { name: "Payment System", description: "Card processing and billing platform", business_criticality: "High" },
  { name: "Employee Portal", description: "Internal intranet and HR self-service", business_criticality: "Medium" },
  { name: "Financial Database", description: "Core financial records and ledger", business_criticality: "Critical" },
  { name: "Email System", description: "Corporate mail and messaging", business_criticality: "Medium" },
  { name: "HR System", description: "Workforce and payroll management", business_criticality: "Medium" },
  { name: "Cloud Storage", description: "Enterprise document and file storage", business_criticality: "Medium" },
  { name: "Administrative Console", description: "Privileged infrastructure administration", business_criticality: "Critical" },
];

export const EMPLOYEES = [
  { user_id: "EMP001", name: "Sarah Chen", department: "Technology", job_role: "Software Engineer", account_status: "active", privilege_level: "standard", typical_login_hour: 9, typical_logout_hour: 17, assigned_applications: ["Employee Portal", "Cloud Storage", "Customer Portal"] },
  { user_id: "EMP002", name: "Marcus Rodriguez", department: "Technology", job_role: "DevOps Engineer", account_status: "active", privilege_level: "elevated", typical_login_hour: 9, typical_logout_hour: 17, assigned_applications: ["Employee Portal", "Cloud Storage", "Administrative Console"] },
  { user_id: "EMP003", name: "Emily Johnson", department: "Finance", job_role: "Financial Analyst", account_status: "active", privilege_level: "standard", typical_login_hour: 8, typical_logout_hour: 16, assigned_applications: ["Employee Portal", "Financial Database"] },
  { user_id: "EMP004", name: "David Kim", department: "Finance", job_role: "Finance Manager", account_status: "active", privilege_level: "elevated", typical_login_hour: 8, typical_logout_hour: 16, assigned_applications: ["Employee Portal", "Financial Database", "Payment System"] },
  { user_id: "EMP005", name: "Jessica Williams", department: "Human Resources", job_role: "HR Specialist", account_status: "active", privilege_level: "standard", typical_login_hour: 8, typical_logout_hour: 17, assigned_applications: ["Employee Portal", "HR System"] },
  { user_id: "EMP006", name: "Michael Brown", department: "Human Resources", job_role: "HR Director", account_status: "active", privilege_level: "elevated", typical_login_hour: 8, typical_logout_hour: 17, assigned_applications: ["Employee Portal", "HR System", "Administrative Console"] },
  { user_id: "EMP007", name: "Ashley Martinez", department: "Operations", job_role: "Operations Analyst", account_status: "active", privilege_level: "standard", typical_login_hour: 7, typical_logout_hour: 15, assigned_applications: ["Employee Portal"] },
  { user_id: "EMP008", name: "James Wilson", department: "Operations", job_role: "Operations Manager", account_status: "active", privilege_level: "elevated", typical_login_hour: 7, typical_logout_hour: 15, assigned_applications: ["Employee Portal", "Cloud Storage"] },
  { user_id: "EMP009", name: "Amanda Anderson", department: "Customer Support", job_role: "Support Agent", account_status: "active", privilege_level: "standard", typical_login_hour: 9, typical_logout_hour: 21, assigned_applications: ["Employee Portal", "Customer Portal"] },
  { user_id: "EMP010", name: "Kevin Taylor", department: "Customer Support", job_role: "Support Lead", account_status: "active", privilege_level: "elevated", typical_login_hour: 9, typical_logout_hour: 21, assigned_applications: ["Employee Portal", "Customer Portal"] },
  { user_id: "EMP011", name: "Ryan Garcia", department: "Cybersecurity", job_role: "SOC Analyst", account_status: "active", privilege_level: "elevated", typical_login_hour: 0, typical_logout_hour: 24, assigned_applications: ["Employee Portal", "Administrative Console", "Cloud Storage"] },
  { user_id: "EMP012", name: "Nicole Thompson", department: "Cybersecurity", job_role: "CISO", account_status: "active", privilege_level: "admin", typical_login_hour: 0, typical_logout_hour: 24, assigned_applications: ["Employee Portal", "Administrative Console", "Cloud Storage", "Financial Database", "HR System", "Payment System", "Customer Portal", "Email System"] },
];

export const DETECTION_RULES = [
  {
    rule_id: "R001",
    name: "Repeated Authentication Failures",
    description: "Detects an unusual concentration of failed login attempts associated with the same user within a short time window. A single failed login is normal; repeated failures close together may indicate a brute-force or credential-stuffing attempt.",
    behavior_detected: "3 or more LOGIN_FAILURE events for the same user within 5 minutes",
    severity: "Medium",
    enabled: true,
  },
  {
    rule_id: "R002",
    name: "Unusual Access Time",
    description: "Flags activity that occurs significantly outside a user's simulated normal working schedule. This does not classify the user as malicious — it describes the activity as unusual and requiring review.",
    behavior_detected: "Login or access activity more than 1 hour outside the user's typical schedule",
    severity: "Low",
    enabled: true,
  },
  {
    rule_id: "R003",
    name: "Significant Permission Change",
    description: "Detects important changes to user permissions, roles or privilege levels. Changes involving privileged accounts or critical systems receive greater attention and a higher severity.",
    behavior_detected: "ROLE_CHANGE or PERMISSION_CHANGE events, escalated for privileged users or critical assets",
    severity: "High",
    enabled: true,
  },
  {
    rule_id: "R004",
    name: "Repeated Access Denials",
    description: "Detects repeated attempts to access applications or resources that a user is not authorized to use. Occasional denials happen; a cluster suggests probing or privilege escalation attempts.",
    behavior_detected: "3 or more ACCESS_DENIED events for the same user within 5 minutes",
    severity: "Medium",
    enabled: true,
  },
  {
    rule_id: "R005",
    name: "Sensitive Application Activity",
    description: "Applies greater scrutiny to activity involving high-value systems such as the Payment System, Administrative Console or Financial Database when combined with another suspicious signal (off-schedule access, recent failures, or access denials).",
    behavior_detected: "Activity on High/Critical assets combined with a secondary suspicious signal",
    severity: "High",
    enabled: true,
  },
];

const employeeMap = Object.fromEntries(EMPLOYEES.map((e) => [e.user_id, e]));
const applicationMap = Object.fromEntries(APPLICATIONS.map((a) => [a.name, a]));

export const lookup = {
  employee: (id) => employeeMap[id],
  application: (name) => applicationMap[name],
};