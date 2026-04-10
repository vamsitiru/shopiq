import { searchProducts as searchAmazonProducts } from './amazon/productService.js';
import { searchProducts as searchEbayProducts } from './ebay/productService.js';
import { calculateScores } from '../utils/scoreCalculator.js';
import { calculateConfidence } from '../utils/confidenceCalculator.js';
import { compareProducts } from '../utils/compareProducts.js';
import { applyLLMDecision } from '../utils/llmDecisionEngine.js';
import { generateExplanation } from '../utils/llmExplanationEngine.js';

const providers = {
  amazon: searchAmazonProducts,
  ebay: searchEbayProducts
};

const DEFAULT_SOURCES = ['amazon', 'ebay'];

function normalizeSources(sources) {
  if (!sources) return DEFAULT_SOURCES;
  if (typeof sources === 'string') {
    return sources.split(',').map(src => src.trim().toLowerCase()).filter(Boolean);
  }
  if (Array.isArray(sources)) {
    return sources.map(src => String(src).trim().toLowerCase()).filter(Boolean);
  }
  return DEFAULT_SOURCES;
}

export async function searchProducts(query, sources, onStreamChunk) {
  const normalizedSources = normalizeSources(sources);
  const requests = normalizedSources.map((source) => {
    const provider = providers[source];
    if (!provider) {
      return Promise.resolve({ source, error: new Error(`Unknown product source: ${source}`) });
    }

    return provider(query)
      .then((data) => ({ source, data }))
      .catch((error) => ({ source, error }));
  });

  const results = await Promise.all(requests);
  const products = [];
  const errors = [];

  results.forEach((result) => {
    if (result.error) {
      console.error(`Product search failed for ${result.source}:`, result.error);
      errors.push({ source: result.source, message: result.error.message || 'Unknown error' });
      return;
    }

    const sourceProducts = Array.isArray(result.data) ? result.data : [];
    sourceProducts.forEach((product) => products.push({ ...product, source: result.source }));
  });

  if (products.length === 0 && errors.length > 0) {
    throw new Error(errors.map((err) => `${err.source}: ${err.message}`).join(' | '));
  }

  // 2. Score
  const scored = calculateScores(products);

  // 3. Add Confidence
  const enriched = scored.map((p) => ({
    ...p,
    ...calculateConfidence(p),
  }));

  // 4. Deterministic result
  let result = compareProducts(enriched);

  // 5. LLM Decision
  result = await applyLLMDecision(result, { 
    provider: 'ollama',
    onChunk: onStreamChunk ? (chunk) => onStreamChunk({ type: 'decision_chunk', chunk }) : null
  });

  // 6. LLM Explanation
  result = await generateExplanation(result, { 
    provider: "ollama", 
    maxAlternatives: 3,
    onChunk: onStreamChunk ? (chunk) => onStreamChunk({ type: 'explanation_chunk', chunk }) : null
  });

  return result;
}