import fetch from "node-fetch";
import { context, trace } from '@opentelemetry/api';
import { countTokens , calculateCost } from "./tokenUtils.js";
import {
  llmInputTokens,
  llmOutputTokens,
  llmCost,
  llmLatency
} from "./llmPrometheusMetrics.js";


const tracer = trace.getTracer("llm-explanation-engine");

const DEFAULT_CONFIG = {
  maxAlternatives: 3,
};

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
    tag: p.tag || null,
  };
}

// ---------- Prompt Builder ----------

function buildExplanationPrompt(winner, alternatives) {
  return `
You are an expert product advisor.

Explain the product comparison in a simple, helpful way.

Respond JSON strictly in this format:
{
  "whyBest": "Why the winner is best",
  "whyNotOthers": ["Reason 1", "Reason 2"],
  "summary": "Short final recommendation"
}

Winner:
${JSON.stringify(sanitizeProduct(winner), null, 2)}

Other Options:
${JSON.stringify(alternatives.map(sanitizeProduct), null, 2)}

Rules:
- Use ONLY the data provided in the input
- DO NOT assume or invent features
- DO NOT mention anything not present in input
- MUST highlight rating, reviews, price, and trustworthiness
- Keep explanation simple and user-friendly
- Mention risks in alternatives if any
- Avoid technical jargon
- Be concise but insightful
`;
}


// ---------- Ollama ----------
async function callOllama(prompt) {
  
  return await tracer.startActiveSpan('Ollama call for Explanation', async (span) => {

    // Prometheus metrics
    const endTimer = llmLatency.startTimer({ flow: "explanation" });
    const promptTokenCount = countTokens(prompt);

    llmInputTokens.inc({ flow: "explanation_input" }, promptTokenCount);
    
        try {  
          const startTime = Date.now();
          span.setAttribute('llm.type', "LLM_Explanation");
          span.setAttribute('llm.prompt.length', prompt.length);
    
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
          span.setAttribute('llm.latency.time_ms', duration);
          const responseTokenCount = countTokens(data.response);
          llmOutputTokens.inc({ flow: "explanation_output" },responseTokenCount);
          const cost = calculateCost(promptTokenCount, responseTokenCount);
          llmCost.inc({ flow: "explanation" }, cost);
          // llmLatency.inc(duration, { flow: "explanation" });
          endTimer();

          return parseResponse(data.response);
        } catch (err) {
          console.error("Error calling Ollama:", err);
            span.recordException(err);
            throw err;
        } finally {
          span.end();
        }
    });

}

// ---------- Parser ----------

function extractJsonPayload(text) {
  const jsonFence = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonFence && jsonFence[1]) {
    return jsonFence[1].trim();
  }

  const genericFence = text.match(/```\s*([\s\S]*?)\s*```/);
  if (genericFence && genericFence[1]) {
    return genericFence[1].trim();
  }

  return text.trim();
}

function parseResponse(text) {
  const payload = extractJsonPayload(text);

  try {
    try {
      console.log("LLM Explanation Payload:", payload);
      return JSON.parse(payload);
    } catch (err) {
      console.warn("Trying to parse on original text as fallback...");
      return JSON.parse(text);
    }
  } catch (err) {
    console.error("Failed to parse LLM response:", err);
    return {
      whyBest: "This product has better overall ratings and reliability.",
      whyNotOthers: ["Other options have lower confidence or fewer reviews"],
      summary: "This is safer and more trusted choice.",
    };
  }
}

// ---------- Main Function ----------
async function generateExplanation(result, options = {}) {
  const { provider = "ollama", maxAlternatives = 3 } = options;

  const winner = result.winner;
  const alternatives = result.ranked
    .filter((p) => p !== winner)
    .slice(0, maxAlternatives);

  const prompt = buildExplanationPrompt(winner, alternatives);

  let llmOutput;

  try {
    console.log("Triggering LLM explanation...");
    llmOutput = await callOllama(prompt)
    console.log("Received LLM explanation.");

  } catch (err) {
    return {
      ...result,
      explanationError: err.message,
    };
  }

  return {
    ...result,
    llmExplanation: llmOutput,
  };
}

export { generateExplanation };

/*
const parentSpan = tracer.startSpan('Product comparison');

const childSpan = tracer.startSpan('Fetch eBay', {
  parent: parentSpan,
});
*/