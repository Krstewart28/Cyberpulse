import React, { useEffect, useState } from "react";
import { ScrollText, Power, PowerOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SeverityBadge from "@/components/SeverityBadge";
import { cn } from "@/lib/utils";

export default function DetectionRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await base44.entities.DetectionRule.list();
      setRules(data || []);
    } catch (e) {
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (rule) => {
    const next = !rule.enabled;
    setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, enabled: next } : r)));
    try {
      await base44.entities.DetectionRule.update(rule.id, { enabled: next });
    } catch (e) {
      setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, enabled: rule.enabled } : r)));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Detection Rules</h2>
        <p className="text-xs text-slate-500">Transparent, explainable detection logic. CyberPulse never uses a black box — every rule is documented and toggleable.</p>
      </div>

      {loading && <p className="text-slate-500">Loading rules…</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rules.map((r) => (
          <div key={r.id} className={cn("rounded-xl border bg-slate-900/60 p-5 transition-colors", r.enabled ? "border-slate-800" : "border-slate-800/50 opacity-70")}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">{r.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={r.severity} />
                <button
                  onClick={() => toggle(r)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium",
                    r.enabled
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-700 bg-slate-800 text-slate-400"
                  )}
                >
                  {r.enabled ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                  {r.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{r.description}</p>
            <div className="mt-3 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Detects</p>
              <p className="mt-0.5 font-mono text-xs text-cyan-300">{r.behavior_detected}</p>
            </div>
            <p className="mt-3 font-mono text-xs text-slate-500">Rule ID: {r.rule_id}</p>
          </div>
        ))}
      </div>

      {!loading && rules.length === 0 && (
        <p className="text-slate-500">No rules found. Rules are seeded automatically on first load.</p>
      )}
    </div>
  );
}