// confidenceCalculator.js

function getReviewConfidence(reviewCount = 0) {
  if (reviewCount <= 0) return 0;

  return Math.min(Math.log10(reviewCount + 1) / 4, 1);
}

function getRatingConfidence(rating = 0, reviewCount = 0) {
  if (reviewCount < 20) return 0.3;

  if (rating >= 4.5 || rating <= 2) return 0.7;

  return 1;
}

function getSellerConfidence(product) {
  if (product.platform === "amazon") return 0.9;

  if (!product.sellerRating) return 0.5;

  if (product.sellerRating >= 99) return 1;
  if (product.sellerRating >= 97) return 0.9;
  if (product.sellerRating >= 95) return 0.75;

  return 0.5;
}

function getDataQuality(product) {
  let score = product.dataCompleteness || 1;

  if (product.isDerived) score -= 0.1;

  return Math.max(score, 0.5);
}

// ---------- Main ----------

function calculateConfidence(product) {
  const reviewConf = getReviewConfidence(product.reviewCount);
  const ratingConf = getRatingConfidence(
    product.rating,
    product.reviewCount
  );
  const sellerConf = getSellerConfidence(product);
  const dataQuality = getDataQuality(product);

  const confidence =
    reviewConf * 0.4 +
    ratingConf * 0.2 +
    sellerConf * 0.2 +
    dataQuality * 0.2;

  const final = Number((confidence * 10).toFixed(2));

  return {
    confidence: final,
    label: getConfidenceLabel(final),
    breakdown: {
      reviewConf: Number(reviewConf.toFixed(2)),
      ratingConf: Number(ratingConf.toFixed(2)),
      sellerConf: Number(sellerConf.toFixed(2)),
      dataQuality: Number(dataQuality.toFixed(2)),
    },
  };
}

// ---------- Label ----------

function getConfidenceLabel(score) {
  if (score >= 8.5) return "Very High";
  if (score >= 7) return "High";
  if (score >= 5) return "Medium";
  return "Low";
}

export {
  calculateConfidence,
};