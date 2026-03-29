import assert from 'node:assert';

const API_URL = 'http://127.0.0.1:3001/api/generate';

async function runTests() {
  console.log('🧪 Starting API Unit Tests...');
  let passed = 0;
  let failed = 0;

  const runTest = async (name, fn) => {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ ${name}`);
      console.error(`   ${e.message}`);
      failed++;
    }
  };

  // Test 1: Analytics Endpoint Validation
  await runTest('Analytics: Rejects missing testCases array', async () => {
    const res = await fetch(`${API_URL}/analytics`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error, 'testCases array required');
  });

  // Test 2: Automation Endpoint Validation
  await runTest('Automation: Rejects missing framework', async () => {
    const res = await fetch(`${API_URL}/automation-code`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ testCase: { id: 'TC-1' } }) 
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error, 'testCase and framework are required');
  });

  // Test 3: Test Cases Endpoint Validation (No story)
  await runTest('TestCases: Rejects empty story payload', async () => {
    const res = await fetch(`${API_URL}/test-cases`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ settings: { llmProvider: 'openai' } }) 
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error, 'Missing story details');
  });

  console.log(`\n📊 Results: ${passed} passed | ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests();
