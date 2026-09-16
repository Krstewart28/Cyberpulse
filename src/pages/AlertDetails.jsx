import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Server, ShieldAlert, Clock, Activity, Calculator } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SeverityBadge from "@/components/SeverityBadge";
import RiskBadge from "@/components/RiskBadge";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  NEW: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  REVIEWING: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  RESOLVED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
};

export default function AlertDetails() {
  const { alertId } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const found = await base44.entities.Alert.filter({ alert_id: alertId });
      const a = found && found[0];
      setAlert(a || null);
      if (a) {
        const evts = await base44.entities.SecurityEvent.filter({ alert_id: alertId }, "-timestamp", 50);
        setRelatedEvents(evts || []);
      }
    } catch (e) {
      setAlert(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertId]);

  const updateStatus = async (status) => {
    if (!alert) return;
    setUpdating(true);
    try {
      await base44.entities.Alert.update(alert.id, { status });
      setAlert({ ...alert, status });
    } catch (e) {
      // ignore
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-500">Loading alert…</div>;
  }

  if (!alert) {
    return (
      <div className="py-20 text-center">
        <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-slate-600" />
        <p className="text-slate-400">Alert not found.</p>
        <button onClick={() => navigate("/alerts")} className="mt-4 text-sm text-cyan-400 hover:text-cyan-300">← Back to alerts</button>
      </div>
    );
  }

  const breakdown = Array.isArray(alert.risk_breakdown) ? alert.risk_breakdown : [];

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/alerts")} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Back to alerts
      </button>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="font-mono text-xs text-cyan-300">{alert.alert_id}</span>
              <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-medium", STATUS_STYLES[alert.status])}>{alert.status}</span>
              <SeverityBadge severity={alert.severity} />
            </div>
            <h1 className="text-xl font-semibold text-white">{alert.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{alert.type} · Rule {alert.rule_id}</p>
          </div>
          <RiskBadge score={alert.risk_score} category={alert.risk_category} className="px-3 py-2" />
        </div>

        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300"><Activity className="h-3.5 w-3.5" /> What happened</p>
          <p className="text-sm leading-relaxed text-slate-300">{alert.detection_explanation}</p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoCard icon={User} title="Who">
            <Field label="User" value={`${alert.user_name} (${alert.user})`} />
            <Field label="Department" value={alert.department} />
            <Field label="Privilege" value={alert.privilege_level} />
          </InfoCard>
          <InfoCard icon={Server} title="Asset">
            <Field label="Application" value={alert.application} />
            <Field label="Criticality" value={alert.asset_criticality} />
            <Field label="Source IP" value={alert.source_ip} mono />
          </InfoCard>
          <InfoCard icon={Clock} title="When">
            <Field label="Timestamp" value={new Date(alert.timestamp).toLocaleString()} />
            <Field label="Related events" value={alert.event_count} />
            <Field label="Rule" value={alert.rule_id} mono />
          </InfoCard>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button disabled={updating || alert.status === "REVIEWING"} onClick={() => updateStatus("REVIEWING")} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-300 hover:bg-amber-500/20 disabled:opacity-40">Mark Reviewing</button>
          <button disabled={updating || alert.status === "RESOLVED"} onClick={() => updateStatus("RESOLVED")} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40">Resolve</button>
          <button disabled={updating || alert.status === "NEW"} onClick={() => updateStatus("NEW")} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40">Reopen</button>
        </div>
      </div>

      {/* Risk breakdown */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Calculator className="h-4 w-4 text-cyan-400" /> Risk Score Breakdown</h2>
        <div className="space-y-2">
          {breakdown.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-slate-300">{b.factor}</span>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${Math.min((b.points / 45) * 100, 100)}%` }} />
              </div>
              <span className="w-10 text-right text-sm font-semibold tabular-nums text-cyan-300">+{b.points}</span>
            </div>
          ))}
          <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="text-sm font-medium text-slate-200">Final Risk Score</span>
            <span className="text-sm font-semibold text-white">{alert.risk_score}/100 — {alert.risk_category}</span>
          </div>
        </div>
      </div>

      {/* Related events timeline */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Activity className="h-4 w-4 text-cyan-400" /> Related Events Timeline ({relatedEvents.length})</h2>
        {relatedEvents.length === 0 ? (
          <p className="text-sm text-slate-500">No related events persisted yet for this alert.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-slate-800 pl-5">
            {relatedEvents.map((e) => (
              <li key={e.id || e.event_id} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-cyan-500 bg-slate-950" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">{new Date(e.timestamp).toLocaleTimeString()}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-200">{e.event_type}</span>
                  <span className="text-xs text-slate-400">→ {e.result}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-300">{e.description}</p>
                <p className="text-xs text-slate-500">{e.source_ip} · {e.device}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><Icon className="h-3.5 w-3.5" /> {title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={cn("text-right text-slate-200", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}