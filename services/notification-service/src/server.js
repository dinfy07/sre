import cors from "cors";
import express from "express";
import pg from "pg";
import promClient from "prom-client";
import { v4 as uuid } from "uuid";

const { Pool } = pg;
const serviceName = "notification-service";
const port = Number(process.env.PORT || 3000);

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "postgres-primary",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "app_user",
  password: process.env.POSTGRES_PASSWORD || "app_password",
  database: process.env.POSTGRES_DB || "endterm",
  max: 10
});

const app = express();
app.use(cors());
app.use(express.json());

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register, prefix: "notification_service_" });
const httpRequests = new promClient.Counter({
  name: "notification_service_http_requests_total",
  help: "Total HTTP requests handled by notification-service",
  labelNames: ["method", "route", "status_code"]
});
const notificationsSent = new promClient.Counter({
  name: "notification_service_sent_total",
  help: "Total simulated notifications sent"
});
register.registerMetric(httpRequests);
register.registerMetric(notificationsSent);

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequests.inc({ method: req.method, route: req.route?.path || req.path, status_code: String(res.statusCode) });
  });
  next();
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY,
      recipient TEXT NOT NULL,
      channel TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

app.get("/health", (_req, res) => {
  res.json({ service: serviceName, status: "ok", uptime: process.uptime(), version: "1.0.0", timestamp: new Date().toISOString() });
});

app.get("/ready", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ service: serviceName, status: "ready" });
  } catch (error) {
    res.status(503).json({ service: serviceName, status: "not_ready", error: error.message });
  }
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.post("/send", async (req, res) => {
  const id = uuid();
  const recipient = req.body.recipient || "demo@example.com";
  const channel = req.body.channel || "email";
  const message = req.body.message || "Your order status changed.";
  const result = await pool.query(
    "INSERT INTO notifications (id, recipient, channel, message, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, recipient, channel, message, status",
    [id, recipient, channel, message, "sent"]
  );
  notificationsSent.inc();
  res.status(202).json(result.rows[0]);
});

app.get("/", async (_req, res) => {
  const result = await pool.query("SELECT id, recipient, channel, message, status, created_at AS \"createdAt\" FROM notifications ORDER BY created_at DESC LIMIT 50");
  res.json(result.rows);
});

initDb()
  .then(() => app.listen(port, () => console.log(`${serviceName} listening on ${port}`)))
  .catch((error) => {
    console.error(`${serviceName} failed to initialize`, error);
    process.exit(1);
  });

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});

