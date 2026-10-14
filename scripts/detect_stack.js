#!/usr/bin/env node

/**
 * Pre-Flight GCP Stack Scanner (detect_stack.js)
 * 
 * Inspects a workspace for Terraform, Kubernetes, Docker, and application manifests
 * to identify in-scope GCP components and recommend specialized skills to activate.
 */

const fs = require('fs');
const path = require('path');

const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

console.log(`\n🔍 Inspecting workspace: ${targetDir}\n`);

const detectedSkills = new Map();

function addDetection(skill, evidence) {
  if (!detectedSkills.has(skill)) {
    detectedSkills.set(skill, []);
  }
  detectedSkills.get(skill).push(evidence);
}

function scanDir(dir, depth = 0) {
  if (depth > 4) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (['node_modules', 'dist', 'build', 'vendor', '.git'].includes(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['k8s', 'kubernetes', 'helm', 'manifests'].includes(entry.name.toLowerCase())) {
        addDetection('gcp-gke-platform', `Directory: ${path.relative(targetDir, fullPath)}`);
      }
      scanDir(fullPath, depth + 1);
    } else if (entry.isFile()) {
      const relPath = path.relative(targetDir, fullPath);
      const ext = path.extname(entry.name).toLowerCase();

      // 1. Terraform / OpenTofu files
      if (ext === '.tf' || ext === '.tfvars') {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('google_cloud_run_')) addDetection('gcp-cloud-run', `${relPath} (google_cloud_run)`);
          if (content.includes('google_container_cluster')) addDetection('gcp-gke-platform', `${relPath} (google_container_cluster)`);
          if (content.includes('google_bigquery_')) {
            addDetection('gcp-bigquery-analytics', `${relPath} (google_bigquery)`);
            addDetection('gcp-bigquery-cost', `${relPath} (BigQuery cost governance)`);
          }
          if (content.includes('google_sql_') || content.includes('google_alloydb_')) addDetection('gcp-databases', `${relPath} (Cloud SQL / AlloyDB)`);
          if (content.includes('google_compute_network') || content.includes('google_compute_router')) addDetection('gcp-networking', `${relPath} (VPC / Networking)`);
          if (content.includes('google_billing_budget') || content.includes('google_monitoring_alert_policy')) addDetection('gcp-computefinops', `${relPath} (Budgets / Alerts)`);
          if (content.includes('google_iam_workload_identity_pool') || content.includes('google_model_armor_')) addDetection('gcp-security-compliance', `${relPath} (Workload Identity / Model Armor)`);
          if (content.includes('google_pubsub_') || content.includes('google_managed_kafka_') || content.includes('google_eventarc_')) addDetection('gcp-pubsub', `${relPath} (Pub/Sub / Eventarc / Managed Kafka)`);
          if (content.includes('google_bigquery_data_transfer_config') || content.includes('google_storage_transfer_job') || content.includes('google_database_migration_service_')) addDetection('gcp-migrations', `${relPath} (Cloud / Data Warehouse Migration)`);
        } catch (e) {}
      }

      // 2. Docker / Containers
      if (entry.name === 'Dockerfile' || entry.name.endsWith('.Dockerfile')) {
        addDetection('gcp-cloud-run', `${relPath} (Containerized Service)`);
      }

      // 3. Application Dependencies (Node.js, Python, Go, Java)
      if (entry.name === 'package.json') {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('@google-cloud/bigquery')) addDetection('gcp-bigquery-ai', `${relPath} (@google-cloud/bigquery)`);
          if (content.includes('@google-cloud/pubsub')) addDetection('gcp-pubsub', `${relPath} (@google-cloud/pubsub)`);
          if (content.includes('@google-cloud/dialogflow') || content.includes('@google/genai')) addDetection('gcp-conversational-ai', `${relPath} (Conversational AI SDK)`);
          if (content.includes('fastmcp') || content.includes('@modelcontextprotocol')) addDetection('gcp-gemini-tooling', `${relPath} (MCP Tooling)`);
        } catch (e) {}
      }

      if (entry.name === 'requirements.txt' || entry.name === 'pyproject.toml') {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('google-cloud-aiplatform') || content.includes('google-adk')) addDetection('gcp-adk-agents', `${relPath} (ADK / Vertex AI)`);
          if (content.includes('google-cloud-pubsub')) addDetection('gcp-pubsub', `${relPath} (google-cloud-pubsub)`);
          if (content.includes('litert') || content.includes('mediapipe')) addDetection('gcp-gemini-robotics', `${relPath} (LiteRT / MediaPipe)`);
          if (content.includes('vllm') || content.includes('ray')) addDetection('gcp-gke-inference', `${relPath} (vLLM / Ray Serving)`);
          if (content.includes('jax') || content.includes('gemma')) addDetection('gcp-frontier-emerging', `${relPath} (JAX / Gemma)`);
          if (content.includes('google-cloud-bigquery')) addDetection('gcp-bigquery-ai', `${relPath} (BigQuery Python SDK)`);
        } catch (e) {}
      }

      if (entry.name === 'go.mod') {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('google.golang.org/adk') || content.includes('adk-go')) addDetection('gcp-adk-agents', `${relPath} (ADK Go SDK)`);
          if (content.includes('cloud.google.com/go/pubsub')) addDetection('gcp-pubsub', `${relPath} (Go Pub/Sub SDK)`);
          if (content.includes('cloud.google.com/go/bigquery')) addDetection('gcp-bigquery-analytics', `${relPath} (Go BigQuery SDK)`);
        } catch (e) {}
      }

      if (entry.name === 'pom.xml' || entry.name === 'build.gradle' || entry.name === 'build.gradle.kts') {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('google-adk') || content.includes('com.google.adk')) addDetection('gcp-adk-agents', `${relPath} (ADK Java SDK)`);
          if (content.includes('google-cloud-pubsub')) addDetection('gcp-pubsub', `${relPath} (Java Pub/Sub SDK)`);
        } catch (e) {}
      }
    }
  }
}

scanDir(targetDir);

console.log('========================================================');
console.log('🎯 PRE-FLIGHT COMPONENT SCAN RESULTS');
console.log('========================================================');

if (detectedSkills.size === 0) {
  console.log('No specific GCP resources automatically detected in workspace.');
  console.log('Recommendation: Consult gcp-skills-index to manually select domain skills.');
} else {
  console.log(`Discovered ${detectedSkills.size} relevant GCP domain(s):\n`);
  for (const [skill, reasons] of detectedSkills.entries()) {
    console.log(`👉 ${skill}:`);
    for (const r of reasons.slice(0, 3)) {
      console.log(`   - Evidence: ${r}`);
    }
    if (reasons.length > 3) {
      console.log(`   - ... and ${reasons.length - 3} more references`);
    }
  }
  console.log('\n💡 Recommended Activation Directive:');
  console.log(`Load: [${Array.from(detectedSkills.keys()).join(', ')}]`);
  console.log(`Preserved Context: ${Math.max(0, 22 - detectedSkills.size)} domain runbooks remain dormant.`);
}
console.log('========================================================\n');
