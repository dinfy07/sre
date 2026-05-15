import cors from "cors";
import express from "express";
import pg from "pg";
import promClient from "prom-client";
import { v4 as uuid } from "uuid";

const { Pool } = pg;
const serviceName = "payment-service";
const port = Number(process.env.PORT || 3000);

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "postgres-primary",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "app_user",
  password: process.env.POSTGRES_PASSWORD || "app_password",
  database: process.env.POSTGRES_DB || "endterm",
  max: 20
});

const app = express();
app.use(cors());
app.use(express.json());

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register, prefix: "payment_service_" });
const httpRequests = new promClient.Counter({
  name: "payment_service_http_requests_total",
  help: "Total HTTP requests handled by payment-service",
  labelNames: ["method", "route", "status_code"]
});
const paymentsAuthorized = new promClient.Counter({
  name: "payment_service_authorized_total",
  help: "Total successful payment authorizations"
});
register.registerMetric(httpRequests);
register.registerMetric(paymentsAuthorized);

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequests.inc({ method: req.method, route: req.route?.path || req.path, status_code: String(res.statusCode) });
  });
  next();
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY,
      order_id TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
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

app.post("/authorize", async (req, res) => {
  const id = uuid();
  const orderId = req.body.orderId || "demo-order";
  const amount = Number(req.body.amount || 99);
  const status = amount > 0 ? "authorized" : "declined";

  const result = await pool.query(
    "INSERT INTO payments (id, order_id, amount, status) VALUES ($1, $2, $3, $4) RETURNING id, order_id AS \"orderId\", amount::float, status",
    [id, orderId, amount, status]
  );

  if (status === "authorized") {
    paymentsAuthorized.inc();
  }

  res.status(status === "authorized" ? 201 : 402).json(result.rows[0]);
});

app.get("/", async (_req, res) => {
  const result = await pool.query("SELECT id, order_id AS \"orderId\", amount::float, status, created_at AS \"createdAt\" FROM payments ORDER BY created_at DESC LIMIT 50");
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

