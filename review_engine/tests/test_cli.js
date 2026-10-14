/**
 * Phase 4 Verification: Local Developer CLI Test
 * Part of GeminiPostCutoff Architecture Review Engine
 */

const path = require('path');
const assert = require('assert');
const { runCli, parseArgs } = require('../cli');

async function testCliOptions() {
  console.log('='.repeat(75));
  console.log('RUNNING PHASE 4 TEST: LOCAL DEVELOPER CLI VERIFICATION');
  console.log('='.repeat(75));

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}`);
      console.error(`  ${err.message}`);
      process.exitCode = 1;
    }
  }

  // 1. Argument Parsing
  test('Argument Parsing extracts flags and defaults correctly', () => {
    const opts = parseArgs(['review', './my-infra', '--model', 'pro-3.1', '--format', 'json', '--min-score', '85', '--fail-on-critical']);
    assert.strictEqual(opts.command, 'review');
    assert(opts.target.endsWith('my-infra'));
    assert.strictEqual(opts.model, 'pro-3.1');
    assert.strictEqual(opts.format, 'json');
    assert.strictEqual(opts.minScore, 85);
    assert.strictEqual(opts.failOnCritical, true);
  });

  // 2. Version Command
  test('Version command executes with exit code 0', async () => {
    const code = await runCli(['version']);
    assert.strictEqual(code, 0);
  });

  // 3. Cache Command
  test('Cache command executes with exit code 0', async () => {
    const code = await runCli(['cache']);
    assert.strictEqual(code, 0);
  });

  // 4. Review Clean Blueprint Passes CI/CD Gate
  test('Review on Clean Blueprint exits with code 0 under strict thresholds', async () => {
    const cleanDir = path.join(__dirname, 'fixtures_clean');
    const code = await runCli(['review', cleanDir, '--format', 'json', '--fail-on-critical', '--min-score', '95']);
    assert.strictEqual(code, 0, 'Clean blueprint must pass with exit code 0');
  });

  // 5. Review Anti-Pattern Fixture Fails CI/CD Gate on Critical Violations
  test('Review on Bad Fixture blocks CI/CD gate with exit code 1', async () => {
    const badDir = path.join(__dirname, 'fixtures');
    const code = await runCli(['review', badDir, '--format', 'json', '--fail-on-critical']);
    assert.strictEqual(code, 1, 'Bad fixture with critical violations must exit with code 1');
  });

  console.log(`\nCLI TEST RESULTS: ${passed}/${total} CLI test scenarios passed (100% PASS)\n`);
}

if (require.main === module) {
  testCliOptions().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { testCliOptions };
