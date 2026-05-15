import cors from "cors";
import express from "express";
import pg from "pg";
import promClient from "prom-client";

const { Pool } = pg;
const serviceName = "profile-service";
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
promClient.collectDefaultMetrics({ register, prefix: "profile_service_" });
const httpRequests = new promClient.Counter({
  name: "profile_service_http_requests_total",
  help: "Total HTTP requests handled by profile-service",
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
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      address TEXT,
      preferences JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    INSERT INTO profiles (user_id, display_name, address, preferences)
    VALUES ('demo-user', 'Demo Operator', 'SRE Lab', '{"theme":"system","alerts":true}')
    ON CONFLICT (user_id) DO NOTHING;
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

app.get("/:userId", async (req, res) => {
  const result = await pool.query(
    "SELECT user_id AS \"userId\", display_name AS \"displayName\", address, preferences, updated_at AS \"updatedAt\" FROM profiles WHERE user_id = $1",
    [req.params.userId]
  );
  if (!result.rows[0]) {
    return res.status(404).json({ error: "profile not found" });
  }
  res.json(result.rows[0]);
});

app.put("/:userId", async (req, res) => {
  const result = await pool.query(
    `INSERT INTO profiles (user_id, display_name, address, preferences, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (user_id)
     DO UPDATE SET display_name = EXCLUDED.display_name, address = EXCLUDED.address, preferences = EXCLUDED.preferences, updated_at = now()
     RETURNING user_id AS "userId", display_name AS "displayName", address, preferences, updated_at AS "updatedAt"`,
    [
      req.params.userId,
      req.body.displayName || "Unnamed User",
      req.body.address || null,
      JSON.stringify(req.body.preferences || {})
    ]
  );
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

