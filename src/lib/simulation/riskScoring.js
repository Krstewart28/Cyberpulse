// Explainable 0–100 risk scoring. Every alert returns a breakdown of how the score was built.

const SEVERITY_BASE = { Low: 15, Medium: 25, High: 35, Critical: 45 };
const CRITICALITY_BASE = { Low: 5, Medium: 10, High: 15, Critical: 20 };
const PRIVILEGE_BASE = { standard: 5, elevated: 15, admin: 20 };

export function categorizeScore(score) {
  if (score <= 24) return "Low";
  if (score <= 49) return "Medium";
  if (score <= 74) return "High";
  return "Critical";
}

export function calculateRisk({ rule, asset, user, unusualTime, correlatedCount }) {
  const breakdown = [];
  let score = 0;

  const sev = SEVERITY_BASE[rule?.severity] ?? 15;
  score += sev;
  breakdown.push({ factor: `Detection Severity (${rule?.severity ?? "Low"})`, points: sev });

  const crit = CRITICALITY_BASE[asset?.business_criticality] ?? 5;
  score += crit;
  breakdown.push({ factor: `Asset Criticality (${asset?.business_criticality ?? "Unknown"})`, points: crit });

  const priv = PRIVILEGE_BASE[user?.privilege_level] ?? 5;
  score += priv;
  breakdown.push({ factor: `User Privilege (${user?.privilege_level ?? "standard"})`, points: priv });

  if (unusualTime) {
    score += 10;
    breakdown.push({ factor: "Behavioral Deviation (off-schedule)", points: 10 });
  }

  const corr = Math.min(correlatedCount || 1, 5) * 2;
  score += corr;
  breakdown.push({ factor: `Correlated Events (${Math.min(correlatedCount || 1, 5)})`, points: corr });

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, category: categorizeScore(score), breakdown };
}