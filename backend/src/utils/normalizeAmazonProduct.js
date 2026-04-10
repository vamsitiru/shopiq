// normalizeAmazonProduct.js

function normalizeAmazonProduct(item) {
  // ---------- Raw Fields ----------
  const price = extractPrice(item);

  const rating = parseFloat(item?.rating || 0);
  const ratingsTotal = parseInt(item?.ratingsTotal || 0);

  // ---------- Flags ----------
  const missingFields = [];
  const derivedFields = [];

  // ---------- Rating ----------
  let finalRating = rating;

  if (!rating) {
    finalRating = 4.0; // neutral-good fallback
    missingFields.push("rating");
    derivedFields.push("rating");
  }

  // ---------- Review Count ----------
  let reviewCount;

  if (ratingsTotal) {
    reviewCount = ratingsTotal; // includes ratings + reviews
  } else {
    reviewCount = 100; // baseline fallback
    missingFields.push("ratingsTotal");
    derivedFields.push("reviewCount");
  }

  // ---------- Seller Trust (Amazon Default) ----------
  const sellerTrust = 85; // 8.5/10 equivalent

  // ---------- Data Completeness ----------
  const dataCompleteness = getDataCompleteness({
    rating,
    ratingsTotal,
  });

  // ---------- Final Normalized Object ----------
  return {
    id: item?.asin || item?.id,
    title: item?.title,

    price,
    currency: item?.price?.currency || "INR",

    platform: "amazon",

    rating: finalRating,
    reviewCount,

    sellerRating: null, // not directly available
    feedbackScore: null,

    sellerTrust, // strong default

    itemUrl: item?.url || item?.detailPageURL,
    condition: item?.condition || "New",

    // meta flags
    isDerived: derivedFields.length > 0,
    derivedFields,
    missingFields,
    dataCompleteness,

    // raw (optional for debugging)
    raw: item,
  };
}

// ---------- Helper: Extract Price Safely ----------

function extractPrice(item) {
  if (!item) return 0;

  // handle different API formats
  if (item?.price?.value) {
    return parseFloat(item.price.value);
  }

  if (item?.price?.amount) {
    return parseFloat(item.price.amount);
  }

  if (typeof item?.price === "number") {
    return item.price;
  }

  return 0;
}

// ---------- Helper: Data Completeness ----------

function getDataCompleteness({ rating, ratingsTotal }) {
  let score = 1;

  if (!rating) score -= 0.3;
  if (!ratingsTotal) score -= 0.3;

  return Math.max(score, 0.5);
}

export { normalizeAmazonProduct };