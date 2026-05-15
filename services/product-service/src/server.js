import cors from "cors";
import express from "express";
import pg from "pg";
import promClient from "prom-client";

const { Pool } = pg;
const serviceName = "product-service";
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
promClient.collectDefaultMetrics({ register, prefix: "product_service_" });
const httpRequests = new promClient.Counter({
  name: "product_service_http_requests_total",
  help: "Total HTTP requests handled by product-service",
  labelNames: ["method", "route", "status_code"]
});
register.registerMetric(httpRequests);

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequests.inc({ method: req.method, route: req.route?.path || req.path, status_code: String(res.statusCode) });
  });
  next();
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC(12,2) NOT NULL,
      inventory INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    INSERT INTO products (id, name, price, inventory)
    VALUES
      ('sku-platform', 'SRE Platform Subscription', 99.00, 100),
      ('sku-observability', 'Observability Add-on', 49.00, 200),
      ('sku-failover', 'Failover Drill Package', 149.00, 25)
    ON CONFLICT (id) DO NOTHING;
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
  const result = await pool.query("SELECT id, name, price::float, inventory FROM products ORDER BY name");
  res.json(result.rows);
});

app.get("/:id", async (req, res) => {
  const result = await pool.query("SELECT id, name, price::float, inventory FROM products WHERE id = $1", [req.params.id]);
  if (!result.rows[0]) {
    return res.status(404).json({ error: "product not found" });
  }
  res.json(result.rows[0]);
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

