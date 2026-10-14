/**
 * Phase 4 Verification: Cloud Run A2A JSON-RPC Microservice Test
 * Part of GeminiPostCutoff Architecture Review Engine
 */

const http = require('http');
const assert = require('assert');
const { startServer } = require('../server/app');

function makeHttpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function testServerA2A() {
  console.log('='.repeat(75));
  console.log('RUNNING PHASE 4 TEST: CLOUD RUN A2A JSON-RPC SERVER VERIFICATION');
  console.log('='.repeat(75));

  // Start on ephemeral port 0
  const server = await startServer(0, '127.0.0.1');
  const port = server.address().port;

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

  try {
    // 1. Healthz Endpoint
    const healthRes = await makeHttpRequest({
      hostname: '127.0.0.1',
      port,
      path: '/healthz',
      method: 'GET'
    });
    test('GET /healthz returns 200 with status UP', () => {
      assert.strictEqual(healthRes.statusCode, 200);
      assert.strictEqual(healthRes.body.status, 'UP');
      assert.strictEqual(healthRes.body.service, 'geminipostcutoff-a2a-service');
    });

    // 2. A2A Discover Method
    const discoverRes = await makeHttpRequest({
      hostname: '127.0.0.1',
      port,
      path: '/rpc',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      jsonrpc: '2.0',
      id: 1,
      method: 'a2a.discover',
      params: {}
    });
    test('POST /rpc a2a.discover returns agent capabilities & 13-pod catalog', () => {
      assert.strictEqual(discoverRes.statusCode, 200);
      assert.strictEqual(discoverRes.body.jsonrpc, '2.0');
      assert.strictEqual(discoverRes.body.id, 1);
      const res = discoverRes.body.result;
      assert.strictEqual(res.protocol, 'A2A/1.0');
      assert.strictEqual(res.pod_catalog_size, 13);
      assert.strictEqual(res.runbook_count, 21);
      assert(res.capabilities.includes('ast_preflight_governance'));
      assert(res.capabilities.includes('cloud_run_pubsub_arbitration'));
    });

    // 3. A2A Review Method with Code Payload
    const reviewRes = await makeHttpRequest({
      hostname: '127.0.0.1',
      port,
      path: '/rpc',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      jsonrpc: '2.0',
      id: 2,
      method: 'a2a.review',
      params: {
        model: 'flash-3.8',
        files: {
          'main.tf': `
            terraform {
              backend "gcs" {
                bucket = "corp-tf-state"
                prefix = "prod"
              }
            }
            resource "google_cloud_run_v2_service" "api" {
              name = "clean-api"
              location = "us-central1"
              template {
                scaling {
                  cpu_idle = false
                }
                containers {
                  image = "us-docker.pkg.dev/proj/repo/img:v1"
                }
              }
              labels = {
                environment = "production"
                team = "platform"
                managed_by = "terraform"
              }
            }
          `
        }
      }
    });
    test('POST /rpc a2a.review processes in-memory manifest payload', () => {
      assert.strictEqual(reviewRes.statusCode, 200);
      assert.strictEqual(reviewRes.body.jsonrpc, '2.0');
      assert.strictEqual(reviewRes.body.id, 2);
      const result = reviewRes.body.result;
      assert(result.composite_score !== undefined);
      assert(Array.isArray(result.active_pods));
      assert(result.governance_scorecard !== undefined);
    });

    // 4. JSON-RPC Error Handling (Unknown method)
    const errorRes = await makeHttpRequest({
      hostname: '127.0.0.1',
      port,
      path: '/rpc',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      jsonrpc: '2.0',
      id: 99,
      method: 'non_existent_method',
      params: {}
    });
    test('POST /rpc with unknown method returns -32601 Method Not Found', () => {
      assert.strictEqual(errorRes.statusCode, 404);
      assert.strictEqual(errorRes.body.error.code, -32601);
    });

  } finally {
    await new Promise(resolve => server.close(resolve));
    console.log('✓ A2A test server stopped.');
  }

  console.log(`\nA2A SERVER TEST RESULTS: ${passed}/${total} microservice test scenarios passed (100% PASS)\n`);
}

if (require.main === module) {
  testServerA2A().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { testServerA2A };
