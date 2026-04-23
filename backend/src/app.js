import './tracing.js';

import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import client from 'prom-client';

const app = express();
app.use(cors());
app.use("/api/products", productRoutes);


/////////////////// Prometheus metrics endpoint

// Collect default system metrics (CPU, memory, etc.)
client.collectDefaultMetrics();

// Custom metric: API response time
var httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Middleware to track request duration
app.use(function (req, res, next) {
  var end = httpRequestDuration.startTimer();

  res.on('finish', function () {
    end({
      method: req.method,
      route: req.path,
      status: res.statusCode
    });
  });

  next();
});

// Expose /metrics endpoint
app.get('/metrics', function (req, res) {
  res.set('Content-Type', client.register.contentType);

  client.register.metrics()
    .then(function (metrics) {
      res.end(metrics);
    })
    .catch(function (err) {
      res.status(500).end(err);
    });
});

console.log('Starting server...');

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('exit', (code) => {
  console.log('Process exited with code', code);
});
app.listen(8000, () => console.log("Server running on port 8000"));