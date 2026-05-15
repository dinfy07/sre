import { useEffect, useMemo, useState } from "react";
import { BarChart3, Boxes, CreditCard, Lock, RefreshCcw, Send, ServerCog, UserCircle } from "lucide-react";
import { createOrder, fetchServiceHealth, type ServiceHealth } from "./api/gatewayClient";
import { StatusCard } from "./components/StatusCard";

type ServiceConfig = {
  title: string;
  path: string;
};

const services: ServiceConfig[] = [
  { title: "Auth", path: "auth" },
  { title: "Products", path: "products" },
  { title: "Orders", path: "orders" },
  { title: "Payments", path: "payments" },
  { title: "Notifications", path: "notifications" },
  { title: "Profiles", path: "profile" }
];

const icons = [Lock, Boxes, ServerCog, CreditCard, Send, UserCircle];

export default function App() {
  const [health, setHealth] = useState<Record<string, ServiceHealth>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string>("-");

  const healthyCount = useMemo(
    () => Object.values(health).filter((item) => item.status === "ok").length,
    [health]
  );

  async function refreshHealth() {
    setLoading(true);
    const results = await Promise.allSettled(
      services.map(async (service) => [service.path, await fetchServiceHealth(service.path)] as const)
    );

    const nextHealth: Record<string, ServiceHealth> = {};
    const nextErrors: Record<string, string> = {};

    results.forEach((result, index) => {
      const service = services[index];
      if (result.status === "fulfilled") {
        nextHealth[result.value[0]] = result.value[1];
      } else {
        nextErrors[service.path] = result.reason instanceof Error ? result.reason.message : "Unknown error";
      }
    });

    setHealth(nextHealth);
    setErrors(nextErrors);
    setLoading(false);
  }

  async function submitDemoOrder() {
    const order = await createOrder();
    setLastOrderId(order.id);
  }

  useEffect(() => {
    void refreshHealth();
    const timer = window.setInterval(() => void refreshHealth(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Production-style SRE commerce platform</p>
          <h1>Endterm DevOps Control Plane</h1>
          <p className="hero-copy">
            React frontend, Nginx gateway, six independent services, PostgreSQL replication, and full monitoring.
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" onClick={() => void refreshHealth()} aria-label="Refresh service health">
            <RefreshCcw size={18} />
            Refresh
          </button>
          <button type="button" onClick={() => void submitDemoOrder()} aria-label="Create demo order">
            <BarChart3 size={18} />
            Demo order
          </button>
        </div>
      </section>

      <section className="summary-grid" aria-label="Platform summary">
        <div className="summary-tile">
          <span>Healthy services</span>
          <strong>{healthyCount}/6</strong>
        </div>
        <div className="summary-tile">
          <span>Gateway path</span>
          <strong>/api</strong>
        </div>
        <div className="summary-tile">
          <span>Last order</span>
          <strong>{lastOrderId}</strong>
        </div>
      </section>

      <section className="status-grid" aria-label="Service health">
        {services.map((service, index) => {
          const Icon = icons[index];
          return (
            <div className="service-frame" key={service.path}>
              <div className="service-frame__label">
                <Icon size={18} />
                <span>{service.path}</span>
              </div>
              <StatusCard
                title={service.title}
                health={health[service.path]}
                loading={loading}
                error={errors[service.path]}
              />
            </div>
          );
        })}
      </section>
    </main>
  );
}

