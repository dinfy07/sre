import cors from "cors";
import express from "express";
import pg from "pg";
import promClient from "prom-client";
import { v4 as uuid } from "uuid";

const { Pool } = pg;
const serviceName = "order-service";
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
promClient.collectDefaultMetrics({ register, prefix: "order_service_" });
const httpRequests = new promClient.Counter({
  name: "order_service_http_requests_total",
  help: "Total HTTP requests handled by order-service",
  labelNames: ["method", "route", "status_code"]
});
const orderCreated = new promClient.Counter({
  name: "order_service_orders_created_total",
  help: "Total orders created"
});
register.registerMetric(httpRequests);
register.registerMetric(orderCreated);

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequests.inc({ method: req.method, route: req.route?.path || req.path, status_code: String(res.statusCode) });
  });
  next();
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      total NUMERIC(12,2) NOT NULL,
      items JSONB NOT NULL,
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

app.get("/", async (_req, res) => {
  const result = await pool.query("SELECT id, user_id AS \"userId\", status, total::float, items, created_at AS \"createdAt\" FROM orders ORDER BY created_at DESC LIMIT 50");
  res.json(result.rows);
});

app.post("/", async (req, res) => {
  const id = uuid();
  const userId = req.body.userId || "anonymous";
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const total = Math.max(items.length, 1) * 99;

  const result = await pool.query(
    "INSERT INTO orders (id, user_id, status, total, items) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id AS \"userId\", status, total::float, items",
    [id, userId, "created", total, JSON.stringify(items)]
  );
  orderCreated.inc();
  res.status(201).json(result.rows[0]);
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

