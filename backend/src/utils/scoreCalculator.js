const DEFAULT_CONFIG = {
  weights: {
    rating: 0.4,
    reviews: 0.2,
    seller: 0.2,
    price: 0.2,
  },
  penalties: {
    lowReviewsThreshold: 50,
    lowReviewsPenalty: 1,
    suspiciousPriceFactor: 0.7,
    suspiciousPricePenalty: 1.5,
    lowSellerRatingThreshold: 90,
    lowSellerPenalty: 2,
  },
  defaults: {
    amazonSellerScore: 8.5, // fallback for Amazon
  },
};

// ---------- Utility Functions ----------

function getEbayRating(sellerRating) {
  if (!sellerRating) return 3.8; // safe neutral fallback

  if (sellerRating >= 99) return 4.6;
  if (sellerRating >= 97) return 4.4;
  if (sellerRating >= 95) return 4.2;
  if (sellerRating >= 90) return 3.9;

  return 3.5; // risky seller
}

function getEbayReviewCount(feedbackScore) {
  if (!feedbackScore) return 50; // fallback baseline

  return Math.min(feedbackScore, 5000);
}

// Normalize rating (0–5 → 0–10)
function getRatingScore(rating = 0) {
  return Math.min((rating / 5) * 10, 10);
}

// Log-scaled review confidence
function getReviewScore(reviewCount = 0) {
  if (reviewCount <= 0) return 0;
  return Math.min(Math.log10(reviewCount + 1) * 2, 10);
}

// Seller trust score
function getSellerScore({
  platform,
  sellerRating,
  feedbackScore,
  config,
}) {
  if (platform === "amazon") {
    return config.defaults.amazonSellerScore;
  }

  if (!sellerRating) return 6.5; // fallback

  // Weighted: % + volume
  const percentScore = sellerRating; // already in %
  const volumeScore = feedbackScore
    ? Math.log10(feedbackScore + 1) * 10
    : 0;

  const combined =
    percentScore * 0.7 + volumeScore * 0.3;

  return Math.min(combined / 10, 10);
}

// Price normalization (relative)
function getPriceScore(price, minPrice, maxPrice) {
  if (!price || minPrice === maxPrice) return 5;

  const score =
    ((maxPrice - price) / (maxPrice - minPrice)) * 10;

  return Math.max(0, Math.min(score, 10));
}

// ---------- Main Calculator ----------

function calculateScore(product, context = {}, customConfig = {}) {
  const config = {
    ...DEFAULT_CONFIG,
    ...customConfig,
  };

  const {
    price,
    rating,
    reviewCount,
    sellerRating,
    feedbackScore,
    platform,
  } = product;

  const { minPrice, maxPrice, avgPrice } = context;

  // Component scores
  const ratingScore = getRatingScore(rating);
  const reviewScore = getReviewScore(reviewCount);
  const sellerScore = getSellerScore({
    platform,
    sellerRating,
    feedbackScore,
    config,
  });
  const priceScore = getPriceScore(price, minPrice, maxPrice);

  // Weighted score
  let finalScore =
    ratingScore * config.weights.rating +
    reviewScore * config.weights.reviews +
    sellerScore * config.weights.seller +
    priceScore * config.weights.price;

  // ---------- Penalties ----------

  // Low reviews
  if (reviewCount < config.penalties.lowReviewsThreshold) {
    finalScore -= config.penalties.lowReviewsPenalty;
  }

  // Suspiciously cheap
  if (avgPrice && price < avgPrice * config.penalties.suspiciousPriceFactor) {
    finalScore -= config.penalties.suspiciousPricePenalty;
  }

  // Low seller rating (eBay)
  if (
    platform === "ebay" &&
    sellerRating &&
    sellerRating < config.penalties.lowSellerRatingThreshold
  ) {
    finalScore -= config.penalties.lowSellerPenalty;
  }

  // Clamp score
  finalScore = Math.max(0, Math.min(finalScore, 10));

  return {
    ...product,
    finalScore: Number(finalScore.toFixed(2)),
    breakdown: {
      ratingScore: Number(ratingScore.toFixed(2)),
      reviewScore: Number(reviewScore.toFixed(2)),
      sellerScore: Number(sellerScore.toFixed(2)),
      priceScore: Number(priceScore.toFixed(2)),
    },
  };
}

// ---------- Batch Helper ----------

function calculateScores(products) {
  const prices = products.map((p) => p.price).filter(Boolean);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice =
    prices.reduce((a, b) => a + b, 0) / prices.length;

  return products.map((product) =>
    calculateScore(product, { minPrice, maxPrice, avgPrice })
  );
}

export {
  calculateScore,
  calculateScores,
};