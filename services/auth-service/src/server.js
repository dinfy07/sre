import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import pg from "pg";
import promClient from "prom-client";

const { Pool } = pg;
const serviceName = "auth-service";
const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.JWT_SECRET || "dev-secret";

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
promClient.collectDefaultMetrics({ register, prefix: "auth_service_" });

const httpRequests = new promClient.Counter({
  name: "auth_service_http_requests_total",
  help: "Total HTTP requests handled by auth-service",
  labelNames: ["method", "route", "status_code"]
});
register.registerMetric(httpRequests);

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequests.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: String(res.statusCode)
    });
  });
  next();
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

app.get("/health", (_req, res) => {
  res.json({
    service: serviceName,
    status: "ok",
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
    timestamp: new Date().toISOString()
  });
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

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
    [email, passwordHash]
  );
  res.status(201).json(result.rows[0]);
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT id, email, password_hash FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: "1h" });
  res.json({ token, user: { id: user.id, email: user.email } });
});

app.get("/validate", (req, res) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, jwtSecret);
    res.json({ valid: true, payload });
  } catch {
    res.status(401).json({ valid: false });
  }
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`${serviceName} listening on ${port}`);
    });
  })
  .catch((error) => {
    console.error(`${serviceName} failed to initialize`, error);
    process.exit(1);
  });

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});

