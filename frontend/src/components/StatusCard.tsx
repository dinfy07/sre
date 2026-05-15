import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ServiceHealth } from "../api/gatewayClient";

type StatusCardProps = {
  title: string;
  health?: ServiceHealth;
  loading: boolean;
  error?: string;
};

export function StatusCard({ title, health, loading, error }: StatusCardProps) {
  const healthy = health?.status === "ok";

  return (
    <article className="status-card">
      <div className="status-card__header">
        <span className={healthy ? "status-icon status-icon--ok" : "status-icon"}>
          {loading ? <Activity size={20} /> : healthy ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
        </span>
        <div>
          <h3>{title}</h3>
          <p>{loading ? "Checking" : error ? "Unavailable" : healthy ? "Healthy" : "Needs attention"}</p>
        </div>
      </div>
      <dl>
        <div>
          <dt>Version</dt>
          <dd>{health?.version ?? "-"}</dd>
        </div>
        <div>
          <dt>Uptime</dt>
          <dd>{health ? `${Math.floor(health.uptime)}s` : "-"}</dd>
        </div>
      </dl>
    </article>
  );
}

