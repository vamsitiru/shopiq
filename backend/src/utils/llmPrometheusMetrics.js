import { Counter, Histogram } from "prom-client";

// Token counters
const llmInputTokens = new Counter({
  name: "llm_input_tokens_total",
  help: "Total input tokens",
  labelNames: ["flow"], // decision | explanation
});

const llmOutputTokens = new Counter({
  name: "llm_output_tokens_total",
  help: "Total output tokens",
  labelNames: ["flow"],
});

// Cost tracking
const llmCost = new Counter({
  name: "llm_cost_total",
  help: "Total LLM cost in USD",
  labelNames: ["flow"],
});

// Latency histogram (optional but powerful)
const llmLatency = new Histogram({
  name: "llm_latency_seconds",
  help: "LLM latency",
  labelNames: ["flow"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export {
  llmInputTokens,
  llmOutputTokens,
  llmCost,
  llmLatency
};