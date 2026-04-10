function containsEvidence(output, product) {
  return (
    output.includes(product.rating.toString()) ||
    output.includes(product.reviewCount.toString())
  );
}

const test_explanation_grounded = {
  name: "Explanation should use actual numbers",

  input: {},

  check: (output, winner) => containsEvidence(output, winner)
};

const test_llm_tiebreak = {
  name: "LLM should prefer higher confidence when scores are close",

  input: {
    A: { finalScore: 7.2, confidence: 6 },
    B: { finalScore: 7.1, confidence: 9 }
  },

  expected: "B"
};