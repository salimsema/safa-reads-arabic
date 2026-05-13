const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

// Security: Rate limiting configuration
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 300000; // Cleanup every 5 minutes

function isRateLimited(clientIP) {
  const now = Date.now();
  const clientData = requestCounts.get(clientIP) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  
  if (now > clientData.resetAt) {
    clientData.count = 0;
    clientData.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  
  clientData.count++;
  requestCounts.set(clientIP, clientData);
  
  return clientData.count > RATE_LIMIT_MAX_REQUESTS;
}

// Periodic cleanup of stale rate limit entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetAt + RATE_LIMIT_WINDOW_MS) {
      requestCounts.delete(ip);
    }
  }
}, RATE_LIMIT_CLEANUP_INTERVAL_MS);

// Security: Content Security Policy
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "media-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

// Security headers to be set on all responses
const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

// Security: Validate path to prevent directory traversal attacks
function validatePath(baseDir, userPath) {
  // Decode the URL path to handle encoded sequences like %2e%2e%2f (../)
  const decodedPath = decodeURIComponent(userPath);
  // Resolve the full path relative to base directory
  const resolvedPath = path.resolve(baseDir, decodedPath);
  // Ensure the resolved path is within the base directory
  return resolvedPath.startsWith(baseDir + path.sep) || resolvedPath === baseDir;
}

const server = http.createServer((req, res) => {
  // Security: Get client IP for rate limiting
  // Note: X-Forwarded-For can be spoofed, so we validate it
  let clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim();
  // If IP is invalid (empty, contains .., or is IPv6 with colons while we expect IPv4), use socket address
  // IPv4 has dots, IPv6 has colons - we prioritize socket address for accuracy
  if (!clientIP || clientIP.includes('..') || clientIP.includes(':')) {
    clientIP = req.socket.remoteAddress || 'unknown';
  }
  
  // Security: Apply rate limiting
  if (isRateLimited(clientIP)) {
    res.writeHead(429, { 'Content-Type': 'text/plain' });
    res.end('Too Many Requests');
    return;
  }
  
  // Security: Only allow GET requests
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain', 'Allow': 'GET' });
    res.end('Method Not Allowed');
    return;
  }
  
  // Security: Validate and sanitize the URL path
  const requestedPath = req.url.split('?')[0]; // Strip query string
  
  // Block paths with null bytes
  if (requestedPath.includes('\x00')) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }
  
  // Security: Validate path to prevent directory traversal
  if (!validatePath(PUBLIC_DIR, requestedPath)) {
    console.warn(`Path traversal attempt blocked from ${clientIP}: ${requestedPath}`);
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  // Determine file path
  const safePath = requestedPath === '/' ? '/index.html' : requestedPath;
  let filePath = path.join(PUBLIC_DIR, safePath);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }
  
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    
    // Apply security headers to all responses
    const headers = { 'Content-Type': contentType };
    Object.assign(headers, SECURITY_HEADERS);
    
    res.writeHead(200, headers);
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});