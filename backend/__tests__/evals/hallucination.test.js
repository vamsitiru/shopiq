function detectHallucination(output, inputProducts) {
  const allowedWords = JSON.stringify(inputProducts).toLowerCase();

  const suspiciousWords = ["ai", "copilot", "rtx", "ssd", "gaming"];

  return suspiciousWords.some(word =>
    output.toLowerCase().includes(word) &&
    !allowedWords.includes(word)
  );
}

const test_no_hallucination = {
  name: "LLM should not invent features",

  input: {
    products: [
      { title: "HP Laptop", rating: 4.3 }
    ]
  },

  check: (llmOutput) => !detectHallucination(llmOutput)
};
