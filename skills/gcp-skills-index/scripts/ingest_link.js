/**
 * Automated GCP Article Ingestion Helper CLI
 * Usage: node ingest_link.js <url> [optional_skill_override]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const baseDir = path.join('C:', 'Users', 'campabadal', '.gemini', 'config', 'skills');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchPage(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function computeKey(dateTag) {
  const m = dateTag.match(/\[(\d{2})\.(\d{2})/);
  if (!m) return 0;
  return (2000 + parseInt(m[2], 10)) * 100 + parseInt(m[1], 10);
}

async function run() {
  const targetUrl = process.argv[2];
  if (!targetUrl) {
    console.log('Please provide a URL to ingest.');
    process.exit(1);
  }

  console.log('Inspecting URL:', targetUrl);
  const html = await fetchPage(targetUrl);
  
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const dateMatch = html.match(/<meta property="article:published_time" content="([^"]*)"/i) || html.match(/"datePublished":"([^"]*)"/i) || html.match(/(\d{4}-\d{2}-\d{2})/);
  
  let title = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : (titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'GCP Technical Deep Dive');
  title = title.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  
  let rawDate = dateMatch ? dateMatch[1] : new Date().toISOString();
  let [year, month] = rawDate.split('T')[0].split('-').slice(0, 2);
  let mm = month;
  let yy = year.slice(-2);
  
  const formattedTag = `[${mm}.${yy} Blogpost]`;
  const markdownLink = `- [${formattedTag}: ${title}](${targetUrl})`;
  console.log('Formatted Entry:', markdownLink);
  console.log('Sort Key:', computeKey(formattedTag));
}

run();
