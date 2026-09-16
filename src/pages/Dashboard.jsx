import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ShieldAlert, ShieldCheck, AlertTriangle, Flame, Clock } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useSimulation } from "@/lib/simulation/SimulationContext";
import StatCard from "@/components/StatCard";
import SeverityBadge from "@/components/SeverityBadge";
import RiskBadge from "@/components/RiskBadge";

const SEV_COLORS = { Low: "#34d399", Medium: "#fbbf24", High: "#fb923c", Critical: "#fb7185" };

function bucketByHour(items, key = "timestamp") {
  const map = {};
  for (const it of items) {
    const d = new Date(it[key]);
    const label = `${String(d.getHours()).padStart(2, "0")}:00`;
    map[label] = (map[label] || 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

export default function Dashboard() {
  const { events, alerts, stats } = useSimulation();
  const navigate = useNavigate();

  const eventsSeries = useMemo(() => bucketByHour(events), [events]);
  const alertsSeries = useMemo(() => bucketByHour(alerts), [alerts]);
  const severityData = useMemo(
    () => [
      { name: "Low", value: stats.bySeverity.Low, fill: SEV_COLORS.Low },
      { name: "Medium", value: stats.bySeverity.Medium, fill: SEV_COLORS.Medium },
      { name: "High", value: stats.bySeverity.High, fill: SEV_COLORS.High },
      { name: "Critical", value: stats.bySeverity.Critical, fill: SEV_COLORS.Critical },
    ].filter((d) => d.value > 0),
    [stats.bySeverity]
  );
  const typeData = useMemo(
    () => Object.entries(stats.byType).map(([name, count]) => ({ name, count })),
    [stats.byType]
  );
  const highPriority = useMemo(
    () => alerts.filter((a) => a.risk_score >= 50).slice(0, 6),
    [alerts]
  );

  const tooltipStyle = { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Events Processed" value={stats.eventsProcessed} icon={Activity} accent="text-cyan-300" sub={`${stats.eventsRejected} rejected`} />
        <StatCard label="Total Alerts" value={stats.alertsGenerated} icon={ShieldAlert} accent="text-slate-100" />
        <StatCard label="Open Alerts" value={stats.openAlerts} icon={Clock} accent="text-amber-300" />
        <StatCard label="High-Risk" value={stats.highRiskAlerts} icon={AlertTriangle} accent="text-orange-300" />
        <StatCard label="Critical" value={stats.criticalAlerts} icon={Flame} accent="text-rose-300" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Security Events Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={eventsSeries}>
              <defs>
                <linearGradient id="evGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#22d3ee" fill="url(#evGrad)" name="Events" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Alerts Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={alertsSeries}>
              <defs>
                <linearGradient id="alGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#fb7185" fill="url(#alGrad)" name="Alerts" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Alerts by Severity</h3>
          {severityData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                  {severityData.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Alerts by Detection Type</h3>
          {typeData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={140} tick={{ fill: "#94a3b8" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-200">Recent High-Priority Alerts</h3>
          <button onClick={() => navigate("/alerts")} className="text-xs text-cyan-400 hover:text-cyan-300">View all →</button>
        </div>
        {highPriority.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-slate-600" />
            No high-priority alerts yet. Start the simulation to generate activity.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {highPriority.map((a) => (
              <button
                key={a.alert_id}
                onClick={() => navigate(`/alerts/${a.alert_id}`)}
                className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-slate-800/40"
              >
                <RiskBadge score={a.risk_score} category={a.risk_category} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{a.title}</p>
                  <p className="truncate text-xs text-slate-500">{a.user_name} · {a.application} · {a.source_ip}</p>
                </div>
                <SeverityBadge severity={a.severity} />
                <span className="hidden text-xs text-slate-500 sm:inline">{new Date(a.timestamp).toLocaleTimeString()}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-slate-600">
      No data yet
    </div>
  );
}