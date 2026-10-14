/**
 * Cross-Region Network Egress & Topology Auditor
 * Part of GeminiPostCutoff Architecture Review Engine
 * 
 * Inspects regional collocation across Compute, Serverless, Databases, and Storage
 * to flag costly cross-region egress charges ($0.08-$0.12/GB), roundtrip latency penalties (100ms+),
 * and international data sovereignty / residency compliance risks.
 */

class TopologyAuditor {
  constructor() {}

  auditTopology(terraformInventory) {
    const resources = terraformInventory.resources || [];
    const locationMap = new Map();
    const findings = [];

    // Extract location/region for each resource
    for (const res of resources) {
      const loc = this._extractLocation(res);
      if (loc) {
        locationMap.set(`${res.type}.${res.name}`, {
          type: res.type,
          name: res.name,
          location: loc,
          file: res.file,
          isContinent: this._getContinent(loc)
        });
      }
    }

    // Check cross-resource connections and regional dispersion
    const locationsFound = new Set(Array.from(locationMap.values()).map(r => r.location));
    const continentsFound = new Set(Array.from(locationMap.values()).map(r => r.isContinent));

    // If multiple continents detected for a connected compute/data stack
    if (continentsFound.size > 1) {
      findings.push({
        pillar: 'Pillar 3: Compute FinOps & Workload Sizing',
        pod: 'Pod 7: Cloud Networking & Pod 5: Compute FinOps',
        severity: 'HIGH_RISK',
        rule: 'CROSS_CONTINENT_DATA_TRAVERSAL',
        resource: 'Global Topology',
        file: terraformInventory.files ? terraformInventory.files[0] : 'main.tf',
        message: `Workload spans multiple geographic continents (${Array.from(continentsFound).join(', ')}). Intercontinental network egress incurs up to $0.12/GB in avoidable bandwidth fees.`,
        remediation: 'Collocate high-throughput compute, serverless, and analytical datastores within the same region or multi-region bucket.'
      });

      findings.push({
        pillar: 'Pillar 2: Zero-Trust Security & Hardening',
        pod: 'Pod 6: Security Hardening & Zero-Trust Pod',
        severity: 'HIGH_RISK',
        rule: 'DATA_RESIDENCY_SOVEREIGNTY_RISK',
        resource: 'Global Topology',
        file: terraformInventory.files ? terraformInventory.files[0] : 'main.tf',
        message: `Cross-continent topology detected across ${Array.from(continentsFound).join(' and ')}. Check GDPR / jurisdictional data localization mandates.`,
        remediation: 'Implement Assured Workloads or isolate EU data residency perimeters.'
      });
    }

    // Check specific cross-region pairs (e.g. Cloud Run talking to remote database or storage)
    const computeServices = Array.from(locationMap.values()).filter(r => 
      r.type.includes('cloud_run') || r.type.includes('container_cluster') || r.type.includes('compute_instance')
    );
    const dataStores = Array.from(locationMap.values()).filter(r => 
      r.type.includes('sql') || r.type.includes('spanner') || r.type.includes('bigquery') || r.type.includes('storage')
    );

    for (const c of computeServices) {
      for (const d of dataStores) {
        if (c.location !== d.location && c.isContinent !== d.isContinent) {
          findings.push({
            pillar: 'Pillar 4: Observability & Telemetry',
            pod: 'Pod 7: Cloud Networking & Connectivity Pod',
            severity: 'HIGH_RISK',
            rule: 'CROSS_REGION_LATENCY_PENALTY',
            resource: `${c.name} ➔ ${d.name}`,
            file: c.file,
            message: `Compute resource '${c.name}' in '${c.location}' interacts with data store '${d.name}' in '${d.location}'. Inter-continental network latency (+80ms to +160ms) risks SLA violations.`,
            remediation: `Migrate '${d.name}' to region '${c.location}' or deploy read replicas in '${c.location}'.`
          });
        }
      }
    }

    return {
      total_located_resources: locationMap.size,
      distinct_regions: Array.from(locationsFound),
      distinct_continents: Array.from(continentsFound),
      findings
    };
  }

  _extractLocation(res) {
    const body = res.raw_body || '';
    const locMatch = body.match(/location\s*=\s*["']([^"']+)["']/);
    if (locMatch) return locMatch[1];

    const regMatch = body.match(/region\s*=\s*["']([^"']+)["']/);
    if (regMatch) return regMatch[1];

    const zoneMatch = body.match(/zone\s*=\s*["']([^"']+)["']/);
    if (zoneMatch) {
      // us-central1-a -> us-central1
      const parts = zoneMatch[1].split('-');
      if (parts.length >= 3) return `${parts[0]}-${parts[1]}`;
      return zoneMatch[1];
    }
    return null;
  }

  _getContinent(regionStr) {
    const lower = regionStr.toLowerCase();
    if (lower.startsWith('us-') || lower === 'us') return 'NORTH_AMERICA';
    if (lower.startsWith('europe-') || lower === 'eu') return 'EUROPE';
    if (lower.startsWith('asia-')) return 'ASIA';
    if (lower.startsWith('southamerica-')) return 'SOUTH_AMERICA';
    if (lower.startsWith('australia-')) return 'AUSTRALIA';
    if (lower.startsWith('me-')) return 'MIDDLE_EAST';
    if (lower.startsWith('africa-')) return 'AFRICA';
    return 'GLOBAL_OR_UNKNOWN';
  }
}

module.exports = { TopologyAuditor };
