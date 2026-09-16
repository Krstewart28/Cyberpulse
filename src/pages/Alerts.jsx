import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SeverityBadge from "@/components/SeverityBadge";
import RiskBadge from "@/components/RiskBadge";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  NEW: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  REVIEWING: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  RESOLVED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.Alert.list("-timestamp", 200);
      setAlerts(data || []);
    } catch (e) {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const types = useMemo(() => Array.from(new Set(alerts.map((a) => a.type))), [alerts]);

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (sevFilter && a.severity !== sevFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.alert_id?.toLowerCase().includes(q) &&
          !a.user_name?.toLowerCase().includes(q) &&
          !a.application?.toLowerCase().includes(q) &&
          !a.title?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [alerts, search, sevFilter, statusFilter, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Alert Explorer</h2>
          <p className="text-xs text-slate-500">Alerts persisted in PostgreSQL. An alert is activity that matched a detection rule — distinct from raw events.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search alert, user, app…" className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none" />
        </div>
        <select value={sevFilter} onChange={(e) => setSevFilter(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none">
          <option value="">All severities</option>
          <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none">
          <option value="">All statuses</option>
          <option>NEW</option><option>REVIEWING</option><option>RESOLVED</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none">
          <option value="">All detection types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="max-h-[640px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900/95 backdrop-blur">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Alert ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Application</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Loading alerts…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                  No alerts yet. Start the simulation to generate and persist alerts.
                </td></tr>
              )}
              {filtered.map((a) => (
                <tr key={a.id} onClick={() => navigate(`/alerts/${a.alert_id}`)} className="cursor-pointer hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-mono text-xs text-cyan-300">{a.alert_id}</td>
                  <td className="px-4 py-2.5 text-slate-200">{a.title}</td>
                  <td className="px-4 py-2.5 text-slate-300">{a.user_name}</td>
                  <td className="px-4 py-2.5 text-slate-400">{a.application}</td>
                  <td className="px-4 py-2.5"><SeverityBadge severity={a.severity} /></td>
                  <td className="px-4 py-2.5"><RiskBadge score={a.risk_score} category={a.risk_category} /></td>
                  <td className="px-4 py-2.5">
                    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-medium", STATUS_STYLES[a.status])}>{a.status}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">{new Date(a.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}