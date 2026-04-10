const test_high_reviews_win = {
  name: "High review product should win",

  input: [
    { platform: "amazon", rating: 4.4, reviewCount: 5000, price: 3000 },
    { platform: "ebay", rating: 4.6, reviewCount: 20, price: 2800 }
  ],

  expected: {
    winnerPlatform: "amazon"
  }
};

const test_low_confidence_penalty = {
  name: "Low confidence product should not win",

  input: [
    { platform: "amazon", rating: 4.5, reviewCount: 50, confidence: 4 },
    { platform: "ebay", rating: 4.3, reviewCount: 1000, confidence: 9 }
  ],

  expected: {
    winnerPlatform: "ebay"
  }
};
