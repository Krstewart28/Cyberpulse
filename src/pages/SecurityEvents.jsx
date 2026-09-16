import React, { useMemo, useState } from "react";
import { Search, ShieldAlert, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useSimulation } from "@/lib/simulation/SimulationContext";
import { VALID_EVENT_TYPES } from "@/lib/simulation/validation";
import { APPLICATIONS } from "@/lib/simulation/fictionalData";
import SeverityBadge from "@/components/SeverityBadge";
import { cn } from "@/lib/utils";

const RESULT_ICON = {
  success: { icon: CheckCircle2, cls: "text-emerald-400" },
  info: { icon: AlertCircle, cls: "text-slate-400" },
  failure: { icon: XCircle, cls: "text-amber-400" },
  denied: { icon: XCircle, cls: "text-rose-400" },
};

export default function SecurityEvents() {
  const { events } = useSimulation();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [appFilter, setAppFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (typeFilter && e.event_type !== typeFilter) return false;
      if (appFilter && e.application !== appFilter) return false;
      if (resultFilter && e.result !== resultFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !e.user_name?.toLowerCase().includes(q) &&
          !e.user?.toLowerCase().includes(q) &&
          !e.source_ip?.toLowerCase().includes(q) &&
          !e.event_id?.toLowerCase().includes(q) &&
          !e.description?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [events, search, typeFilter, appFilter, resultFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Security Events</h2>
          <p className="text-xs text-slate-500">Live event feed — persisted to PostgreSQL. Events linked to an alert are flagged.</p>
        </div>
        <span className="rounded-md border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-400">{filtered.length} shown</span>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, IP, event ID…"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none">
          <option value="">All event types</option>
          {Array.from(VALID_EVENT_TYPES).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={appFilter} onChange={(e) => setAppFilter(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none">
          <option value="">All applications</option>
          {APPLICATIONS.map((a) => (
            <option key={a.name} value={a.name}>{a.name}</option>
          ))}
        </select>
        <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none">
          <option value="">All results</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="denied">Denied</option>
          <option value="info">Info</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="max-h-[640px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900/95 backdrop-blur">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Application</th>
                <th className="px-4 py-3">Source IP</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">No events match the current filters.</td>
                </tr>
              )}
              {filtered.map((e) => {
                const ri = RESULT_ICON[e.result] || RESULT_ICON.info;
                const Icon = ri.icon;
                return (
                  <tr
                    key={e.event_id}
                    onClick={() => setSelected(e)}
                    className={cn("cursor-pointer hover:bg-slate-800/40", !e.is_valid && "opacity-60")}
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-400">{new Date(e.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("font-mono text-xs", e.is_valid ? "text-slate-200" : "text-rose-400")}>{e.event_type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{e.user_name || e.user}</td>
                    <td className="px-4 py-2.5 text-slate-400">{e.application}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{e.source_ip}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("inline-flex items-center gap-1 text-xs", ri.cls)}>
                        <Icon className="h-3.5 w-3.5" /> {e.result}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {e.alert_id ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs text-rose-300"><ShieldAlert className="h-3 w-3" /> Alert</span>
                      ) : !e.is_valid ? (
                        <span className="text-xs text-rose-400">invalid</span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/50 p-4 sm:items-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Event Details</h3>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Event ID" value={selected.event_id} mono />
              <Row label="Timestamp" value={new Date(selected.timestamp).toLocaleString()} />
              <Row label="Event Type" value={selected.event_type} mono />
              <Row label="User" value={`${selected.user_name} (${selected.user})`} />
              <Row label="Department" value={selected.department} />
              <Row label="Application" value={selected.application} />
              <Row label="Source IP" value={selected.source_ip} mono />
              <Row label="Device" value={selected.device} mono />
              <Row label="Result" value={selected.result} />
              <Row label="Valid" value={selected.is_valid ? "Yes" : `No — ${selected.validation_error}`} />
              <Row label="Description" value={selected.description} />
              {selected.alert_id && <Row label="Linked Alert" value={selected.alert_id} mono accent="text-rose-300" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono, accent }) {
  return (
    <div className="flex gap-3 border-b border-slate-800/60 pb-2">
      <span className="w-28 shrink-0 text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className={cn("flex-1 text-slate-200", mono && "font-mono text-xs", accent)}>{value}</span>
    </div>
  );
}