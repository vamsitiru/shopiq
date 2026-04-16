import './tracing.js';

import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";

import productRoutes from "./routes/productRoutes.js";

const app = express();
app.use(cors());

app.use("/api/products", productRoutes);

console.log('Starting server...');

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('exit', (code) => {
  console.log('Process exited with code', code);
});
app.listen(8000, () => console.log("Server running on port 8000"));