async function runEval(testCase) {
  const result = await runPipeline(testCase.input);

  const pass =
    result.winner.platform === testCase.expected.winnerPlatform;

  console.log(`${testCase.name}: ${pass ? "✅ PASS" : "❌ FAIL"}`);
}