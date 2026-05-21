const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const env = require("./config/env");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/api", routes);

// Root route — shows server status
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MediBook API</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f1f5f9; }
        .card { background: white; border-radius: 16px; padding: 40px 48px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); text-align: center; max-width: 400px; }
        .dot { display: inline-block; width: 12px; height: 12px; background: #22c55e; border-radius: 50%; margin-right: 8px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        h1 { color: #0f172a; margin: 16px 0 8px; font-size: 24px; }
        p { color: #64748b; margin: 4px 0; font-size: 14px; }
        .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; margin-top: 16px; }
        a { color: #2563eb; text-decoration: none; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div style="font-size:48px">❤️</div>
        <h1>MediBook API</h1>
        <p><span class="dot"></span><strong>Server is running</strong></p>
        <p style="margin-top:8px">Healthcare appointment booking system</p>
        <div class="badge">✅ Online</div>
        <p style="margin-top:20px"><a href="/api/health">View health check →</a></p>
      </div>
    </body>
    </html>
  `);
});

app.use(errorHandler);

module.exports = app;
