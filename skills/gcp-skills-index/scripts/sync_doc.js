const fs = require('fs');
const path = require('path');
const https = require('https');

const DOC_ID = '1urCxEMLIs-L7qbpDbvbu0k21U0BM8Flqlm9vR8DF4fc';
const EXPORT_URL = `https://docs.google.com/document/d/${DOC_ID}/export?format=html`;
const BASE_SKILLS_DIR = path.resolve(__dirname, '..', '..');

function fetchDocHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchDocHtml(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function cleanUrl(rawHref) {
  if (!rawHref) return '';
  if (rawHref.includes('google.com/url?q=')) {
    try {
      const u = new URL(rawHref);
      return u.searchParams.get('q') || rawHref;
    } catch(e) {
      return rawHref;
    }
  }
  return rawHref;
}

function decodeEntities(str) {
  return str
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

async function sync() {
  console.log(`Fetching latest Google Doc export from: ${EXPORT_URL}`);
  const rawHtml = await fetchDocHtml(EXPORT_URL);
  console.log(`Fetched ${rawHtml.length} bytes of HTML.`);

  const pRegex = /<p[^>]*>(.*?)<\/p>/gis;
  let pMatch;
  const allEntries = [];

  while ((pMatch = pRegex.exec(rawHtml)) !== null) {
    let pContent = pMatch[1];
    const aRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gis;
    let aMatch;
    const linksInP = [];
    while ((aMatch = aRegex.exec(pContent)) !== null) {
      const url = cleanUrl(aMatch[1]);
      const text = decodeEntities(aMatch[2].replace(/<[^>]+>/g, '').trim());
      if (text && url) {
        linksInP.push({ text, url });
      }
    }

    if (linksInP.length > 0) {
      for (const l of linksInP) {
        allEntries.push({ type: 'link', text: l.text, url: l.url });
      }
    } else {
      const plainText = decodeEntities(pContent.replace(/<[^>]+>/g, '').trim());
      if (plainText) {
        allEntries.push({ type: 'header', text: plainText });
      }
    }
  }

  const skillEntries = {
    'gcp-security-compliance': [],
    'gcp-finops-killswitch': [],
    'gcp-cloud-run': [],
    'gcp-gke-platform': [],
    'gcp-gke-cost': [],
    'gcp-gke-inference': [],
    'gcp-adk-agents': [],
    'gcp-conversational-ai': [],
    'gcp-gemini-tooling': [],
    'gcp-frontier-emerging': [],
    'gcp-bigquery-analytics': [],
    'gcp-bigquery-ai': [],
    'gcp-bigquery-cost': [],
    'gcp-geospatial': [],
    'gcp-migrations': [],
    'gcp-networking': [],
    'gcp-databases': [],
    'gcp-gemini-robotics': [],
    'gcp-android-xr': [],
    'gcp-knowledge-vault': []
  };

  let currentSkill = 'gcp-security-compliance';

  for (let i = 0; i < allEntries.length; i++) {
    const item = allEntries[i];
    if (item.type === 'header') {
      const h = item.text.trim();
      if (h.includes('Sysadmin') || h.includes('Security and Management Basics')) {
        currentSkill = 'gcp-security-compliance';
      } else if (h.includes('Hit the ground running') || h.includes('budgetary considerations')) {
        currentSkill = 'gcp-finops-killswitch';
      } else if (h.includes('Worthwhile AI Reads')) {
        currentSkill = 'gcp-adk-agents';
      } else if (h.includes('Minimal Infrastructure') || h.includes('Infrastructure Basics') || h.includes('Cloud Run Basics') || h.includes('Agent Infrastructure on Cloud Run')) {
        currentSkill = 'gcp-cloud-run';
      } else if (h.includes('Kubernetes Infrastructure')) {
        currentSkill = 'gcp-gke-platform';
      } else if (h.includes('Kubernetes Cost Control')) {
        currentSkill = 'gcp-gke-cost';
      } else if (h.includes('Kubernetes AI')) {
        currentSkill = 'gcp-gke-inference';
      } else if (h.includes('Agents:') || h.includes('Agents, Advanced') || h.includes('ADK Agents V1.0+')) {
        currentSkill = 'gcp-adk-agents';
      } else if (h.includes('Conversational Agents')) {
        currentSkill = 'gcp-conversational-ai';
      } else if (h.includes('Gemini CLI') || h.includes('Terraform')) {
        currentSkill = 'gcp-gemini-tooling';
      } else if (h.includes('100% Generative') || h.includes('GenAI Supercut') || h.includes('Veo') || h.includes('Retrieval-Augmented') || h.includes('Model & Model Tuning')) {
        currentSkill = 'gcp-frontier-emerging';
      } else if (h.includes('BigQuery Basics') || h.includes('BigQuery Advanced')) {
        currentSkill = 'gcp-bigquery-analytics';
      } else if (h.includes('BigQuery AI/ML')) {
        currentSkill = 'gcp-bigquery-ai';
      } else if (h.includes('BigQuery Cost Control') || h.includes('BigQuery Tuning')) {
        currentSkill = 'gcp-bigquery-cost';
      } else if (h.includes('Geospatial') || h.includes('Earth Engine') || h.includes('BigQuery Geospatial')) {
        currentSkill = 'gcp-geospatial';
      } else if (h.includes('Migrations') || h.includes('Azure Professionals') || h.includes('Other Migrations') || h.includes('BigQuery Migrations')) {
        currentSkill = 'gcp-migrations';
      } else if (h.includes('Networking') || h.includes('Cloud Networking')) {
        currentSkill = 'gcp-networking';
      } else if (h.includes('Databases') || h.includes('Firestore') || h.includes('Persistent Disks')) {
        currentSkill = 'gcp-databases';
      } else if (h.includes('Apigee')) {
        currentSkill = 'gcp-frontier-emerging';
      } else if (h.includes('Security') && !h.includes('Basics')) {
        currentSkill = 'gcp-security-compliance';
      } else if (h.includes('Gemini Robotics')) {
        currentSkill = 'gcp-gemini-robotics';
      } else if (h.includes('Android XR')) {
        currentSkill = 'gcp-android-xr';
      } else if (h.includes('AlphaFold')) {
        currentSkill = 'gcp-frontier-emerging';
      } else if (h.includes('Gemini Enterprise')) {
        currentSkill = 'gcp-frontier-emerging';
      } else if (h.includes('Cloud Api Registry')) {
        currentSkill = 'gcp-frontier-emerging';
      } else if (h.includes('Vector Index/Search')) {
        currentSkill = 'gcp-frontier-emerging';
      } else if (h.includes('Google AntiGravity')) {
        currentSkill = 'gcp-gemini-tooling';
      } else if (h.includes('Cloud SQL Optimization')) {
        currentSkill = 'gcp-databases';
      } else if (h.includes('Jax/TPUs')) {
        currentSkill = 'gcp-frontier-emerging';
      } else if (h.includes('Pub/Sub')) {
        currentSkill = 'gcp-frontier-emerging';
      } else if (h.includes('Twilight Zone') || h.includes('Link Recycle Bin') || h.includes('Worthwhile Rabbit') || h.includes('Extra Links')) {
        currentSkill = 'gcp-knowledge-vault';
      }
    } else if (item.type === 'link') {
      skillEntries[currentSkill].push(item);
    }
  }

  skillEntries['gcp-knowledge-vault'].push(
    { text: '[08.26 Blogpost]: Eval-Driven Development for Agent Skills (Firebase Blog)', url: 'https://firebase.blog/posts/2026/08/eval-driven-development-agent-skills' },
    { text: '[2026 Article]: Agent Plugins: Package Your Skills, Tools, and More (Google Developers Blog)', url: 'https://developers.googleblog.com/agent-plugins-package-your-skills-tools-and-more/' },
    { text: '[2026 Article]: The Anatomy of an AI Agent on Google Cloud: A Complete Guide', url: 'https://medium.com/google-cloud/the-anatomy-of-an-ai-agent-on-google-cloud-a-complete-guide-974605863619' },
    { text: '[2026 Article]: Google Cloud Skills Tutorial Part 5: Build Your Own Custom Skill', url: 'https://medium.com/google-cloud/google-cloud-skills-tutorial-part-5-build-your-own-custom-skill-1d7082f31936' },
    { text: '[2026 Article]: Agents Are Now Files (Roya90)', url: 'https://medium.com/@roya90/agents-are-now-files-4ecc3c352a29' }
  );

  let totalUpdated = 0;
  for (const [skillName, links] of Object.entries(skillEntries)) {
    totalUpdated += links.length;
    const skillDir = path.join(BASE_SKILLS_DIR, skillName);
    const refDir = path.join(skillDir, 'references');
    if (!fs.existsSync(refDir)) fs.mkdirSync(refDir, { recursive: true });

    let articlesMd = `# ${skillName} Reference Knowledge Base & Links\n\n`;
    articlesMd += `This reference vault contains all chronological articles, official documentation, codelabs, and tutorials for \`${skillName}\`.\n\n`;
    articlesMd += `### All Indexed Resources (${links.length} links)\n\n`;

    const dated = [];
    const undated = [];
    for (const l of links) {
      if (/\[\d{2}\.\d{2}/.test(l.text)) dated.push(l);
      else undated.push(l);
    }

    if (dated.length > 0) {
      articlesMd += `#### ⏱️ Chronological Articles & Releases\n`;
      for (const l of dated) articlesMd += `- [${l.text}](${l.url})\n`;
      articlesMd += `\n`;
    }

    if (undated.length > 0) {
      articlesMd += `#### 📚 Official Guides, Codelabs & Repositories\n`;
      for (const l of undated) articlesMd += `- [${l.text}](${l.url})\n`;
      articlesMd += `\n`;
    }

    fs.writeFileSync(path.join(refDir, 'articles.md'), articlesMd, 'utf8');
  }

  console.log(`Sync complete! Updated ${Object.keys(skillEntries).length} skills with ${totalUpdated} total links.`);
}

sync().catch(console.error);
