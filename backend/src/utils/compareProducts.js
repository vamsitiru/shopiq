/*
Rank products using score
Factor in confidence
Detect risky winners
Give a clear winner + reasoning (LLM-ready)
*/

function compareProducts(products) {
  if (!products || products.length === 0) {
    return { winner: null, ranked: [], insights: [] };
  }

  // ---------- Step 1: Sort by score ----------
  const ranked = [...products].sort(
    (a, b) => b.finalScore - a.finalScore
  );

  const top = ranked[0];
  const second = ranked[1];

  // ---------- Step 2: Confidence-aware winner ----------
  let winner = top;
  let decisionType = "score_based";

  if (second) {
    const scoreDiff = top.finalScore - second.finalScore;
    const confidenceDiff = top.confidence - second.confidence;

    // If scores are close, prefer higher confidence
    if (scoreDiff < 0.5 && confidenceDiff < 0) {
      winner = second;
      decisionType = "confidence_override";
    }

    // If top has low confidence, avoid risky pick
    if (top.confidence < 5 && second.confidence > top.confidence) {
      winner = second;
      decisionType = "risk_avoidance";
    }
  }

  // ---------- Step 3: Tagging ----------
  const tagged = ranked.map((p, index) => {
    let tag = null;

    if (index === 0) tag = "🏆 Best Overall";

    if (p.price && top.price && p.price < top.price * 0.8) {
      tag = "💰 Best Value";
    }

    if (p.confidence < 5) {
      tag = "⚠️ Risky";
    }

    if (p.reviewCount < 50) {
      tag = "🆕 Low Reviews";
    }

    return {
      ...p,
      tag,
    };
  });

  // ---------- Step 4: Insights ----------
  const insights = [];

  if (winner.confidence < 6) {
    insights.push(
      "Top product has lower confidence — consider safer alternative."
    );
  }

  if (top.price && second?.price && top.price > second.price * 1.3) {
    insights.push(
      "Top product is significantly more expensive than alternatives."
    );
  }

  if (top.reviewCount > 1000) {
    insights.push("Highly validated product with strong review base.");
  }

  // ---------- Step 5: Explanation (LLM-ready) ----------
  const explanation = generateExplanation(winner, decisionType);

  return {
    winner,
    ranked: tagged,
    insights,
    explanation,
    decisionType,
  };
}

// ---------- Explanation Builder ----------

function generateExplanation(product, decisionType) {
  const reasons = [];

  if (product.rating >= 4.3) {
    reasons.push("high rating");
  }

  if (product.reviewCount > 500) {
    reasons.push("strong review volume");
  }

  if (product.price && product.price < product.avgPrice) {
    reasons.push("competitive pricing");
  }

  if (product.platform === "ebay" && product.sellerRating >= 98) {
    reasons.push("trusted seller");
  }

  let prefix = "Selected as best product";

  if (decisionType === "confidence_override") {
    prefix = "Selected due to higher reliability despite similar score";
  }

  if (decisionType === "risk_avoidance") {
    prefix = "Safer choice selected over higher-risk alternative";
  }

  return `${prefix} because of ${reasons.join(", ")}.`;
}

export {
  compareProducts,
};