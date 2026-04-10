// normalizeEbayProduct.js

function normalizeEbayProduct(item) {
  // ---------- Raw Fields ----------
  const price = parseFloat(item?.price?.value || 0);

  const seller = item?.seller || {};
  const sellerRating = seller?.feedbackPercentage
    ? parseFloat(seller.feedbackPercentage)
    : null;

  const feedbackScore = seller?.feedbackScore || null;

  // ---------- Flags ----------
  const missingFields = [];
  const derivedFields = [];

  // ---------- Derive Rating ----------
  let rating;

  if (sellerRating) {
    rating = deriveRatingFromSeller(sellerRating);
    derivedFields.push("rating");
  } else {
    rating = 3.8; // safe fallback
    missingFields.push("sellerRating");
    derivedFields.push("rating");
  }

  // ---------- Derive Review Count ----------
  let reviewCount;

  if (feedbackScore) {
    reviewCount = Math.min(feedbackScore, 5000);
    derivedFields.push("reviewCount");
  } else {
    reviewCount = 50; // baseline fallback
    missingFields.push("feedbackScore");
    derivedFields.push("reviewCount");
  }

  // ---------- Seller Score Fallback ----------
  let sellerTrust;

  if (sellerRating) {
    sellerTrust = sellerRating;
  } else {
    sellerTrust = 65; // neutral fallback (6.5/10)
    missingFields.push("sellerRating");
  }

  // ---------- Data Completeness ----------
  const dataCompleteness = getDataCompleteness({
    sellerRating,
    feedbackScore,
  });

  // ---------- Final Normalized Object ----------
  return {
    id: item?.itemId,
    title: item?.title,
    price,
    currency: item?.price?.currency || "INR",

    platform: "ebay",

    rating, // derived
    reviewCount, // derived

    sellerRating, // may be null
    feedbackScore,

    sellerTrust, // always present (fallback safe)

    itemUrl: item?.itemWebUrl,
    condition: item?.condition,

    // meta flags
    isDerived: true,
    derivedFields,
    missingFields,
    dataCompleteness,

    // raw (optional for debugging)
    raw: item,
  };
}

// ---------- Helper: Rating from Seller ----------

function deriveRatingFromSeller(sellerRating) {
  if (sellerRating >= 99) return 4.6;
  if (sellerRating >= 97) return 4.4;
  if (sellerRating >= 95) return 4.2;
  if (sellerRating >= 90) return 3.9;

  return 3.5;
}

// ---------- Helper: Data Completeness ----------

function getDataCompleteness({ sellerRating, feedbackScore }) {
  let score = 1;

  if (!sellerRating) score -= 0.3;
  if (!feedbackScore) score -= 0.2;

  return Math.max(score, 0.5);
}

export { normalizeEbayProduct };