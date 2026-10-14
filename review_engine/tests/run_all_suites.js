#!/usr/bin/env node
/**
 * Master Architecture Review Engine Deep Verification Suite
 * 
 * Executes all 5 advanced verification suites:
 * 1. FinOps Mathematical Crossover Verification
 * 2. Deterministic Patch Application & Score Transition Test
 * 3. Cross-Region Egress & Topology Inspection Test
 * 4. 13-Pod Arbitration & Deadlock Fuzzing Test
 * 5. Parser Robustness, Security & Chaos Fuzzing Test
 */

const { runFinOpsMathTests } = require('./test_finops_math');
const { runDiffPatcherTests } = require('./test_diff_patcher');
const { runArbitrationMeshTests } = require('./test_arbitration_mesh');
const { runFuzzerTests } = require('./test_fuzzer');
const { testCliOptions } = require('./test_cli');
const { testServerA2A } = require('./test_server_a2a');
const { TopologyAuditor } = require('../parsers/topology_auditor');
const assert = require('assert');

function runTopologyTests() {
  console.log('='.repeat(75));
  console.log('RUNNING SUITE 3: CROSS-REGION EGRESS & TOPOLOGY INSPECTION TEST');
  console.log('='.repeat(75));

  const auditor = new TopologyAuditor();
  const mockInventory = {
    files: ['main.tf'],
    resources: [
      {
        type: 'google_cloud_run_v2_service',
        name: 'web_frontend',
        file: 'main.tf',
        raw_body: 'name = "web" location = "us-central1"'
      },
      {
        type: 'google_sql_database_instance',
        name: 'user_db',
        file: 'main.tf',
        raw_body: 'name = "db" region = "europe-west1"'
      }
    ]
  };

  const res = auditor.auditTopology(mockInventory);
  assert(res.findings.length >= 2, `Expected >= 2 topology findings, got ${res.findings.length}`);
  assert(res.findings.some(f => f.rule === 'CROSS_CONTINENT_DATA_TRAVERSAL'), 'Must detect cross-continent traversal');
  assert(res.findings.some(f => f.rule === 'DATA_RESIDENCY_SOVEREIGNTY_RISK'), 'Must detect data sovereignty risk');
  assert(res.findings.some(f => f.rule === 'CROSS_REGION_LATENCY_PENALTY'), 'Must detect cross-region latency penalty');

  console.log(`✓ Detected ${res.findings.length} cross-region topology and compliance findings.`);
  console.log('✓ PASS: Cross-Region Network Egress, Latency, and Sovereignty verified.');
  console.log('\nSUITE 3 RESULTS: 100% PASS\n');
}

async function main() {
  console.log('\n' + '#'.repeat(75));
  console.log('STARTING MASTER ARCHITECTURAL DEEP VERIFICATION PIPELINE');
  console.log('#'.repeat(75) + '\n');

  const startTime = Date.now();

  runFinOpsMathTests();
  runDiffPatcherTests();
  runTopologyTests();
  runArbitrationMeshTests();
  runFuzzerTests();
  await testCliOptions();
  await testServerA2A();

  const totalDuration = Date.now() - startTime;

  console.log('#'.repeat(75));
  console.log(`ALL 7 ENTERPRISE VERIFICATION SUITES PASSED SUCCESSFULLY IN ${totalDuration}ms!`);
  console.log('#'.repeat(75) + '\n');
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
