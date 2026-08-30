import http from 'http';
import https from 'https';
import { URL } from 'url';
import { writeFileSync } from 'fs';

const API_BASE = 'http://localhost:3000';
const FRONTEND_BASE = 'http://localhost:5173';
const DELAY_MS = 50;
const TIMEOUT_MS = 5000;

function fetchWithTimeout(url, options = {}, timeout = TIMEOUT_MS) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    const startTime = Date.now();
    
    const req = lib.request(url, { ...options, timeout }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          status: res.statusCode,
          body,
          headers: res.headers,
          responseTime,
          redirected: res.statusCode >= 300 && res.statusCode < 400
        });
      });
    });
    
    req.on('error', () => {
      resolve({ status: 0, body: '', headers: {}, responseTime: 0, redirected: false });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, body: '', headers: {}, responseTime: timeout, redirected: false });
    });
    
    if (options.body) req.write(options.body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractLinksFromHtml(html, baseUrl) {
  const links = new Set();
  
  // Extract href links
  const hrefRegex = /href=["']([^"']+)["']/g;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        links.add(absoluteUrl);
      } catch (e) {
        // Invalid URL, skip
      }
    }
  }
  
  // Extract src links (images, scripts, etc.)
  const srcRegex = /src=["']([^"']+)["']/g;
  while ((match = srcRegex.exec(html)) !== null) {
    const src = match[1];
    if (src && !src.startsWith('data:')) {
      try {
        const absoluteUrl = new URL(src, baseUrl).href;
        links.add(absoluteUrl);
      } catch (e) {
        // Invalid URL, skip
      }
    }
  }
  
  return Array.from(links);
}

async function checkFrontendLinks() {
  console.error('Checking frontend links...');
  const frontendResults = {
    total: 0,
    ok: 0,
    broken: 0,
    redirects: 0,
    links: []
  };
  
  try {
    const res = await fetchWithTimeout(FRONTEND_BASE);
    if (res.status === 200) {
      const links = extractLinksFromHtml(res.body, FRONTEND_BASE);
      frontendResults.total = links.length;
      
      for (const link of links) {
        const linkRes = await fetchWithTimeout(link, { method: 'HEAD' });
        const status = linkRes.status;
        
        frontendResults.links.push({
          url: link,
          status,
          responseTime: linkRes.responseTime,
          redirected: linkRes.redirected
        });
        
        if (status === 200 || status === 304) {
          frontendResults.ok++;
        } else if (status >= 300 && status < 400) {
          frontendResults.redirects++;
        } else if (status === 404) {
          frontendResults.broken++;
        }
        
        await sleep(DELAY_MS);
      }
    }
  } catch (e) {
    console.error('Error checking frontend:', e.message);
  }
  
  return frontendResults;
}

async function main() {
  console.error('Fetching OpenAPI spec...');
  const specRes = await fetchWithTimeout(`${API_BASE}/api/docs-json`);
  if (!specRes || specRes.status !== 200) {
    console.error('Failed to fetch OpenAPI spec');
    process.exit(1);
  }
  
  const spec = JSON.parse(specRes.body);
  const paths = Object.keys(spec.paths);
  console.error(`Found ${paths.length} API paths\n`);
  
  const broken = [];
  const requiresAuth = [];
  const postOnly = [];
  const pathStatusMap = new Map();
  const allResults = [];
  
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const methods = Object.keys(spec.paths[path]).filter(m => ['get','post','put','patch','delete'].includes(m));
    const pathResults = [];
    
    for (const method of methods) {
      const url = `${API_BASE}${path}`;
      const res = await fetchWithTimeout(url, { method: method.toUpperCase() });
      const status = res.status;
      pathResults.push({
        method: method.toUpperCase(),
        status,
        responseTime: res.responseTime,
        redirected: res.redirected
      });
      
      if (status === 404) {
        broken.push({ url, status, method: method.toUpperCase(), responseTime: res.responseTime });
      } else if (status === 401 || status === 403) {
        requiresAuth.push({ url, status, method: method.toUpperCase(), responseTime: res.responseTime });
      }
      
      allResults.push({
        url,
        method: method.toUpperCase(),
        status,
        responseTime: res.responseTime,
        redirected: res.redirected,
        contentType: res.headers['content-type']
      });
      
      await sleep(DELAY_MS);
    }
    
    pathStatusMap.set(path, pathResults);
    
    if ((i + 1) % 100 === 0) {
      console.error(`Progress: ${i + 1}/${paths.length}...`);
    }
  }
  
  console.error('\nCategorizing results...');
  
  for (const [path, pathResults] of pathStatusMap) {
    const url = `${API_BASE}${path}`;
    const has404 = pathResults.some(m => m.status === 404);
    const hasSuccess = pathResults.some(m => m.status !== 404 && m.status !== 0 && m.status !== 401 && m.status !== 403);
    
    if (has404 && hasSuccess) {
      postOnly.push({ url, methods: pathResults.map(m => `${m.method}:${m.status}`) });
      const idx = broken.findIndex(b => b.url === url);
      if (idx >= 0) broken.splice(idx, 1);
    }
  }
  
  const frontendResults = await checkFrontendLinks();
  
  const totalResponseTime = allResults.reduce((sum, r) => sum + r.responseTime, 0);
  const avgResponseTime = allResults.length > 0 ? Math.round(totalResponseTime / allResults.length) : 0;
  const maxResponseTime = allResults.length > 0 ? Math.max(...allResults.map(r => r.responseTime)) : 0;
  
  console.log('\n=== Summary ===');
  console.log(`Total API endpoints checked: ${pathStatusMap.size}`);
  console.log(`Total frontend links checked: ${frontendResults.total}`);
  console.log(`\nAPI Results:`);
  console.log(`  Truly broken (404 all methods): ${broken.length}`);
  console.log(`  POST-only (GET 404, other works): ${postOnly.length}`);
  console.log(`  Requires auth (401/403): ${requiresAuth.length}`);
  console.log(`  Average response time: ${avgResponseTime}ms`);
  console.log(`  Max response time: ${maxResponseTime}ms`);
  console.log(`\nFrontend Results:`);
  console.log(`  OK (200/304): ${frontendResults.ok}`);
  console.log(`  Broken (404): ${frontendResults.broken}`);
  console.log(`  Redirects: ${frontendResults.redirects}`);
  
  if (broken.length > 0) {
    console.log('\n--- Broken URLs ---');
    broken.forEach((b, i) => {
      console.log(`${i + 1}. [${b.status}] ${b.url} [${b.method}] (${b.responseTime}ms)`);
    });
  } else {
    console.log('\nNo broken URLs found.');
  }
  
  if (postOnly.length > 0) {
    console.log(`\n--- POST-only Endpoints (${postOnly.length}) ---`);
    postOnly.forEach((p, i) => {
      console.log(`${i + 1}. ${p.url} → ${p.methods.join(', ')}`);
    });
  }
  
  if (requiresAuth.length > 0) {
    const unique = [...new Map(requiresAuth.map(r => [r.url, r])).values()];
    console.log(`\n--- Requires Auth (${unique.length} unique endpoints) ---`);
    unique.forEach((r, i) => {
      console.log(`${i + 1}. ${r.url}`);
    });
  }
  
  if (frontendResults.broken > 0) {
    console.log('\n--- Broken Frontend Links ---');
    frontendResults.links
      .filter(l => l.status === 404)
      .forEach((l, i) => {
        console.log(`${i + 1}. [${l.status}] ${l.url} (${l.responseTime}ms)`);
      });
  }
  
  const exportData = {
    timestamp: new Date().toISOString(),
    api: {
      totalEndpoints: pathStatusMap.size,
      broken: broken.length,
      postOnly: postOnly.length,
      requiresAuth: requiresAuth.length,
      avgResponseTime,
      maxResponseTime,
      brokenUrls: broken,
      postOnlyEndpoints: postOnly,
      authRequiredEndpoints: requiresAuth.map(r => r.url)
    },
    frontend: frontendResults,
    allResults
  };
  
  writeFileSync('scanner-results.json', JSON.stringify(exportData, null, 2));
  console.log('\nDetailed results exported to scanner-results.json');
}

main().catch(e => {
  console.error('\nFatal error:', e);
  process.exit(1);
});
