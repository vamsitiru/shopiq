import fetch from "node-fetch";

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

Respond ONLY in JSON format:
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
- Keep explanation simple and user-friendly
- Highlight rating, reviews, price, and trust
- Mention risks in alternatives if any
- Avoid technical jargon
- Be concise but insightful
`;
}


// ---------- Ollama ----------

async function callOllama(prompt, onChunk) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    body: JSON.stringify({
      model: "phi3:mini",
      prompt,
      stream: false,
    }),
  });

  const data = await response.json();
  return parseResponse(data.response);
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
    console.log("LLM Explanation Payload:", payload);
    return JSON.parse(payload);
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
  const { provider = "ollama", maxAlternatives = 3, onChunk } = options;

  const winner = result.winner;
  const alternatives = result.ranked
    .filter((p) => p !== winner)
    .slice(0, maxAlternatives);

  const prompt = buildExplanationPrompt(winner, alternatives);

  let llmOutput;

  try {
    llmOutput = await callOllama(prompt, onChunk)
        
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