const test_e2e = {
  name: "Full pipeline test",

  input: [
    { platform: "amazon", rating: 4.4, reviewCount: 5000, price: 3000 },
    { platform: "ebay", rating: 4.3, reviewCount: 200, price: 2500 }
  ],

  expected: {
    winner: "amazon",
    noHallucination: true,
    explanationQuality: "good"
  }
};