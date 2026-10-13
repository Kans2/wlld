import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import campaignRoutes from './routes/campaign.routes';
import submissionRoutes from './routes/submission.routes';

const app = express();

// ─── Security & Parsing ─────────────────────────────────────────
// Relax CSP so Next.js hydration scripts and styles are not blocked
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: env.FRONTEND_URL || true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health Check ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Meme\'d Campaign Payout Tracker API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/submissions', submissionRoutes);

// ─── API 404 Handler ────────────────────────────────────────────
app.use('/api', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
  });
});

// ─── Serve Frontend .next Build Files ───────────────────────────
// Prioritize current directory (backend) where .next was pasted, then fallback
const candidateFrontendDirs = [
  path.resolve(process.cwd()),                // Current directory (backend)
  path.resolve(__dirname, '..'),              // Parent of src/ or dist/ (backend)
  path.resolve(__dirname, '../..'),           // Workspace root
  path.resolve(process.cwd(), '../frontend'), // Fallback to sibling frontend
  path.resolve(__dirname, '../../frontend'),
  path.resolve(process.cwd(), 'frontend'),
];

let frontendDir: string | null = null;
for (const dir of candidateFrontendDirs) {
  if (fs.existsSync(path.join(dir, '.next'))) {
    frontendDir = dir;
    break;
  }
}

if (frontendDir) {
  console.log(`📦 Serving frontend Next.js build from: ${frontendDir}`);
  const nextStaticDir = path.join(frontendDir, '.next/static');
  const serverAppDir = path.join(frontendDir, '.next/server/app');
  const publicDir = path.join(frontendDir, 'public');

  // 1. Next.js static chunks & assets (/_next/static/*)
  if (fs.existsSync(nextStaticDir)) {
    app.use(
      '/_next/static',
      express.static(nextStaticDir, {
        maxAge: '1y',
        immutable: true,
        dotfiles: 'allow',
      })
    );
  }

  // 2. Public folder static assets (/file.svg, etc.)
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir, { maxAge: '1d', dotfiles: 'allow' }));
  }

  // 3. Favicon handler
  app.get('/favicon.ico', (_req, res) => {
    const faviconBody = path.join(serverAppDir, 'favicon.ico.body');
    const publicFavicon = path.join(publicDir, 'favicon.ico');
    if (fs.existsSync(faviconBody)) {
      res.setHeader('Content-Type', 'image/x-icon');
      return res.send(fs.readFileSync(faviconBody));
    }
    if (fs.existsSync(publicFavicon)) {
      res.setHeader('Content-Type', 'image/x-icon');
      return res.send(fs.readFileSync(publicFavicon));
    }
    res.status(204).end();
  });

  // 4. Resolve and serve Next.js prerendered routes and RSC payloads
  const resolveFrontendFile = (urlPath: string): string | null => {
    const cleanPath = urlPath.split('?')[0].split('#')[0].replace(/^\/+|\/+$/g, '');

    // Root path -> index.html
    if (!cleanPath) {
      const idx = path.join(serverAppDir, 'index.html');
      return fs.existsSync(idx) ? idx : null;
    }

    // Direct file match (e.g. .rsc files, manifest files)
    const exact = path.join(serverAppDir, cleanPath);
    if (fs.existsSync(exact) && fs.statSync(exact).isFile()) {
      return exact;
    }

    // Route HTML file (e.g. /login -> login.html, /brand -> brand.html)
    const htmlFile = path.join(serverAppDir, `${cleanPath}.html`);
    if (fs.existsSync(htmlFile) && fs.statSync(htmlFile).isFile()) {
      return htmlFile;
    }

    // Dynamic brand campaign detail route
    if (/^brand\/campaigns\/[^/]+$/.test(cleanPath)) {
      const brandDyn = path.join(serverAppDir, 'brand/campaigns/[id].html');
      if (fs.existsSync(brandDyn)) return brandDyn;
    }

    // Dynamic creator campaign detail route
    if (/^creator\/campaigns\/[^/]+$/.test(cleanPath)) {
      const creatorDyn = path.join(serverAppDir, 'creator/campaigns/[id].html');
      if (fs.existsSync(creatorDyn)) return creatorDyn;
    }

    // Directory index
    const dirIdx = path.join(serverAppDir, cleanPath, 'index.html');
    if (fs.existsSync(dirIdx) && fs.statSync(dirIdx).isFile()) {
      return dirIdx;
    }

    // Fallback to index.html for client-side routing
    const fallbackIdx = path.join(serverAppDir, 'index.html');
    if (fs.existsSync(fallbackIdx)) {
      return fallbackIdx;
    }

    return null;
  };

  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    if (req.path.startsWith('/api')) {
      return next();
    }

    const targetFile = resolveFrontendFile(req.path);
    if (targetFile) {
      try {
        const content = fs.readFileSync(targetFile);
        if (targetFile.endsWith('.rsc')) {
          res.setHeader('Content-Type', 'text/x-component; charset=utf-8');
        } else if (targetFile.endsWith('.html')) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
        return res.send(content);
      } catch (err) {
        return next(err);
      }
    }

    next();
  });
}

// ─── Catch-all 404 Handler ──────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── Global Error Handler ───────────────────────────────────────
app.use(errorHandler);

export default app;
