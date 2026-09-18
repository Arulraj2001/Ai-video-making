import { run } from 'react-snap';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

// Find a modern Chromium/Chrome/Edge binary to prevent legacy ES syntax errors
const candidateChromePaths = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);

const chromePath = candidateChromePaths.find(p => fs.existsSync(p));

console.log('[prerender] Using browser executable:', chromePath || 'Bundled Puppeteer');

const routes = [
  '/',
  '/features',
  '/how-it-works',
  '/use-cases',
  '/pricing',
  '/blog',
  '/contact',
  '/terms',
  '/privacy',
  '/commercial-rights',
  '/security',
  '/cookies',
  '/status',
];

// Clean 200.html if present from previous runs
const fallback200 = path.join(distDir, '200.html');
if (fs.existsSync(fallback200)) {
  fs.unlinkSync(fallback200);
}

try {
  await run({
    source: 'dist',
    destination: 'dist',
    include: routes,
    crawl: false,
    puppeteerArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    puppeteerExecutablePath: chromePath,
    skipThirdPartyRequests: true,
    inlineCss: false,
    fixWebpackChunksIssue: false
  });
  console.log('[prerender] Successfully pre-rendered all routes!');
} catch (error) {
  console.error('[prerender] Error during pre-rendering:', error);
  process.exit(1);
}
