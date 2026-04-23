import { encoding_for_model } from "tiktoken";

const COST_PER_1K_INPUT = 0.0005;   // example
const COST_PER_1K_OUTPUT = 0.0015;
const enc = encoding_for_model("gpt-4"); // good approximation

function countTokens(text) {
  return enc.encode(text).length;
}

function calculateCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1000) * COST_PER_1K_INPUT;
  const outputCost = (outputTokens / 1000) * COST_PER_1K_OUTPUT;

  return inputCost + outputCost;
}

export { countTokens, calculateCost };

/*
Slow response? → Too many tokens
High cost? → Prompt too large
Latency spikes? → Long completions

Tokenization time
Prompt processing time
Model inference phases
Attention layers / decoding steps
*/