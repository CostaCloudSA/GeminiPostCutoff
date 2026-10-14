/**
 * Cloud Run A2A JSON-RPC 2.0 Microservice Server
 * Part of GeminiPostCutoff Architecture Review Engine (Phase 4)
 * 
 * Exposes the 13-Pod ADK Mesh & Mutual Arbitration Engine over the
 * Agent-to-Agent (A2A) JSON-RPC 2.0 protocol for enterprise governance,
 * CI/CD pipelines, and multi-agent coordination.
 * 
 * Implemented using Node's native HTTP library (Zero external server dependencies).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { ArchitectureReviewSupervisor } = require('../mesh/supervisor');
const { PromptSanitizer } = require('../security/sanitizer');
const { ModelCutoffResolver } = require('../mesh/model_resolver');

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const startTime = Date.now();

const repoRoot = path.resolve(__dirname, '..', '..');

// JSON-RPC Error Codes
const RPC_ERRORS = {
  PARSE_ERROR: { code: -32700, message: 'Parse error' },
  INVALID_REQUEST: { code: -32600, message: 'Invalid Request' },
  METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid params' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' }
};

/**
 * Handles A2A Discover method
 */
function handleA2ADiscover(params) {
  const cutoffConfig = ModelCutoffResolver.loadConfig();
  const models = cutoffConfig.models || {};
  const newestModels = Object.keys(models).filter(k => models[k].generation_status === 'newest');
  const olderModels = Object.keys(models).filter(k => models[k].generation_status === 'older');

  return {
    agent_name: 'GeminiPostCutoff Architecture Reviewer',
    version: '2.0.0',
    protocol: 'A2A/1.0',
    vendor: 'Google Cloud Platform & Antigravity',
    model_calibration: {
      default_policy: 'NO_HARDCODED_DEFAULT (Unverified Fail-Safe Horizon or Explicit Model/Cutoff)',
      newest_generation_models: newestModels,
      older_generation_models: olderModels,
      supported_models: Object.keys(models),
      supports_dynamic_cutoff_override: true,
      dynamic_tier_system: 'Dynamic Tier 1 (delta_months > 0), Dynamic Tier 2 (-12 <= delta_months <= 0), Dynamic Tier 3 (delta_months < -12)'
    },
    capabilities: [
      'ast_preflight_governance',
      'gemini_context_caching',
      'dynamic_cutoff_tier_slicing',
      'adversarial_peer_arbitration',
      'cross_region_topology_audit',
      'deterministic_diff_patching',
      'cloud_run_pubsub_arbitration'
    ],
    governance_pillars: [
      'Pillar 1: IaC & Metadata Governance',
      'Pillar 2: Zero-Trust Security & Hardening',
      'Pillar 3: Compute FinOps & Workload Sizing',
      'Pillar 4: Observability & Telemetry'
    ],
    pod_catalog_size: 13,
    runbook_count: 21,
    status: 'READY'
  };
}

/**
 * Handles A2A Review method
 */
async function handleA2AReview(params) {
  const model = params.model || null;
  const cutoff = params.cutoff || null;
  let targetDir = params.target_path;
  let tempSandbox = null;

  try {
    // If files object is passed in payload: { "main.tf": "...", "workload.yaml": "..." }
    if (params.files && typeof params.files === 'object') {
      tempSandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'a2a-review-'));
      for (const [filename, content] of Object.entries(params.files)) {
        // Sanitize path to prevent path traversal
        const safeName = path.basename(filename);
        const subDir = filename.includes('/') ? path.dirname(filename) : '';
        const targetFolder = path.join(tempSandbox, subDir);
        if (!fs.existsSync(targetFolder)) {
          fs.mkdirSync(targetFolder, { recursive: true });
        }
        // Sanitize code comments
        const sanitizedContent = PromptSanitizer.sanitize(content).sanitized;
        fs.writeFileSync(path.join(targetFolder, safeName), sanitizedContent, 'utf8');
      }
      targetDir = tempSandbox;
    }

    if (!targetDir || !fs.existsSync(targetDir)) {
      targetDir = path.join(repoRoot, 'review_engine', 'tests', 'fixtures_clean');
    }

    const supervisor = new ArchitectureReviewSupervisor({
      targetModel: model,
      targetCutoff: cutoff,
      repoRoot
    });

    const review = await supervisor.runReview(targetDir);
    const markdownReport = supervisor.generateReviewArtifact(review);

    const allFindings = review.ast_preflight.pillars
      ? Object.values(review.ast_preflight.pillars).flatMap(p => p.findings || [])
      : [];

    return {
      status: review.final_consensus_status,
      composite_score: review.ast_preflight.summary.global_ast_score,
      model_calibration: review.target_model,
      context_cache_telemetry: review.context_cache,
      governance_scorecard: review.ast_preflight.pillars,
      active_pods: review.pod_evaluations.map(p => p.name),
      arbitration_resolutions: review.peer_arbitration.arbitration_resolutions,
      findings_count: allFindings.length,
      findings: allFindings,
      remediation_diffs: review.ast_preflight.remediation_diffs || [],
      markdown_report: markdownReport
    };
  } finally {
    if (tempSandbox && fs.existsSync(tempSandbox)) {
      try {
        fs.rmSync(tempSandbox, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup failure
      }
    }
  }
}

/**
 * Main HTTP Server
 */
function createServer() {
  return http.createServer(async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check endpoint (for Cloud Run probes)
    if (req.url === '/healthz' || req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'UP',
        service: 'geminipostcutoff-a2a-service',
        version: '1.1.0',
        uptime_seconds: Math.round((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // JSON-RPC 2.0 endpoint
    if (req.method === 'POST' && (req.url === '/rpc' || req.url === '/a2a')) {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        let rpcReq;
        try {
          rpcReq = JSON.parse(body);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: RPC_ERRORS.PARSE_ERROR }));
          return;
        }

        if (!rpcReq || rpcReq.jsonrpc !== '2.0' || !rpcReq.method) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id: rpcReq ? rpcReq.id : null, error: RPC_ERRORS.INVALID_REQUEST }));
          return;
        }

        const id = rpcReq.id !== undefined ? rpcReq.id : null;
        const params = rpcReq.params || {};

        try {
          let result;
          if (rpcReq.method === 'a2a.discover' || rpcReq.method === 'rpc.discover') {
            result = handleA2ADiscover(params);
          } else if (rpcReq.method === 'a2a.review' || rpcReq.method === 'review.execute') {
            result = await handleA2AReview(params);
          } else if (rpcReq.method === 'a2a.health') {
            result = { status: 'HEALTHY', uptime: process.uptime() };
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ jsonrpc: '2.0', id, error: RPC_ERRORS.METHOD_NOT_FOUND }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id, result }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id,
            error: { ...RPC_ERRORS.INTERNAL_ERROR, data: err.message }
          }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', available_endpoints: ['/healthz', '/rpc'] }));
  });
}

function startServer(port = PORT, host = HOST) {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      const address = server.address();
      console.log(`[A2A MICROSERVICE] Running on http://${host}:${address.port}`);
      console.log(`[A2A MICROSERVICE] Health endpoint: http://${host}:${address.port}/healthz`);
      console.log(`[A2A MICROSERVICE] JSON-RPC endpoint: http://${host}:${address.port}/rpc`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('[FATAL] Failed to start A2A server:', err);
    process.exit(1);
  });
}

module.exports = { createServer, startServer, handleA2ADiscover, handleA2AReview };
