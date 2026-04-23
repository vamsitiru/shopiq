import fetch from 'node-fetch';
import { context, trace } from '@opentelemetry/api';
import { countTokens , calculateCost } from "./tokenUtils.js";
import {
  llmInputTokens,
  llmOutputTokens,
  llmCost,
  llmLatency
} from "./llmPrometheusMetrics.js";

const tracer = trace.getTracer("llm-decision-engine");

const DEFAULT_CONFIG = {
  scoreThreshold: 0.7,       // trigger if scores are close
  confidenceThreshold: 1.0,  // trigger if confidence differs
  minConfidence: 5,          // trigger if low confidence
};

// ---------- Trigger Logic ----------

function shouldTriggerLLM(top, second, config = DEFAULT_CONFIG) {
  if (!second) return false;

  const scoreDiff = Math.abs(top.finalScore - second.finalScore);
  const confidenceDiff = Math.abs(top.confidence - second.confidence);

  if (scoreDiff <= config.scoreThreshold) return true;
  if (confidenceDiff >= config.confidenceThreshold) return true;
  if (top.confidence < config.minConfidence) return true;

  return false;
}

// ---------- Prompt Builder ----------

function buildPrompt(top, second) {
  return `
You are an expert product comparison assistant.

Compare the following two products and decide which is better.

Respond ONLY in JSON format:
{
  "winner": "A" or "B",
  "reason": "short explanation",
  "confidence": "high | medium | low"
}

Product A:
${JSON.stringify(sanitizeProduct(top), null, 2)}

Product B:
${JSON.stringify(sanitizeProduct(second), null, 2)}

Rules:
- Prefer higher rating with sufficient reviews
- Prefer higher confidence score
- Avoid risky (low confidence) products
- Consider price vs value
- Be conservative (don't switch unless justified)
`;
}

// ---------- Sanitizer ----------

function sanitizeProduct(p) {
  return {
    title: p.title,
    platform: p.platform,
    price: p.price,
    rating: p.rating,
    reviewCount: p.reviewCount,
    sellerRating: p.sellerRating || null,
    finalScore: p.finalScore,
    confidence: p.confidence,
  };
}

// ---------- Ollama (Local LLM) ----------
async function callOllama(prompt) {
      const span = tracer.startSpan('Ollama call for Decision making');

      const ctx = trace.setSpan(context.active(), span);
      //const boundFn = context.bind(ctx, async () => {
          try {
            const startTime = Date.now();
            // Jaeger attributes
            span.setAttribute('llm.type', "LLM Decision");
            span.setAttribute('llm.prompt.length', prompt.length);
            span.setAttribute('llm.model', 'ollama');
            // Prometheus metrics
            const promptTokenCount = countTokens(prompt);
            const endTimer = llmLatency.startTimer({ flow: "decision" });
            llmInputTokens.inc({ flow: "decision_input" },promptTokenCount);

            const response = await fetch(process.env.OLLAMA_API_URL, {
              method: "POST",
              body: JSON.stringify({
                model: "phi3:mini",
                prompt,
                stream: false,
              }),
            });

            const data = await response.json();

            const duration = Date.now() - startTime;
            //span.setAttribute('llm.response.length', response.length);
            span.setAttribute('llm.latency.time_ms', duration);
            const responseTokenCount = countTokens(data.response);
            llmOutputTokens.inc({ flow: "decision_output" },responseTokenCount);
            const cost = calculateCost(promptTokenCount, responseTokenCount);
            llmCost.inc({ flow: "decision" }, cost);
            //llmLatency.inc(duration, { flow: "decision" });
            endTimer();

            return parseLLMResponse(data.response);
          } catch (err) {
            span.recordException(err);
            throw err;
          } finally {
            span.end();
          }
      //});

      //return await boundFn();
}

// ---------- Response Parser ----------

function parseLLMResponse(text) {
  try {
    const json = JSON.parse(text);
    return json;
  } catch (err) {
    return {
      winner: "A",
      reason: "Fallback to default winner",
      confidence: "low",
    };
  }
}

// ---------- Main Function ----------

async function applyLLMDecision(result, options = {}) {
  const { provider = "ollama" } = options;

  const { ranked } = result;
  const top = ranked[0];
  const second = ranked[1];

  if (!shouldTriggerLLM(top, second)) {
    return {
      ...result,
      llmUsed: false,
    };
  }

  const prompt = buildPrompt(top, second);

  let llmResult;

  try {
    console.log("Triggering LLM decision...");
    llmResult = await callOllama(prompt);
    console.log("Received LLM decision.");
  } catch (err) {
    return {
      ...result,
      llmUsed: false,
      llmError: err.message,
    };
  }

  // ---------- Apply Decision ----------

  let finalWinner = result.winner;

  if (llmResult.winner === "A") {
    llmResult.winner = top;  // Replace "A" with top product details
    finalWinner = top;
  } else if (llmResult.winner === "B" && second) {
    llmResult.winner = second;  // Replace "B" with second product details
    finalWinner = second;
  } else {
    // If invalid or no second, keep original
    llmResult.winner = top;  // Fallback
  }

  return {
    ...result,
    winner: finalWinner,
    llmUsed: true,
    llmDecision: llmResult,
    finalExplanation: llmResult.reason || result.explanation,
  };
}

export {
  applyLLMDecision,
};