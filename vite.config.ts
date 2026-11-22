import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dashboardSpaMiddleware = () => ({
  name: 'collab-dashboard-rewrite',
  configureServer(server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) {
    server.middlewares.use((req, _res, next) => {
      if (req.url && (req.url === '/dashboard/dashboard.html' || req.url.startsWith('/dashboard/dashboard.html?'))) {
        const queryIndex = req.url.indexOf('?');
        const query = queryIndex >= 0 ? req.url.slice(queryIndex) : '';
        req.url = `/index.html${query}`;
      }
      next();
    });
  },
  configurePreviewServer(server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) {
    server.middlewares.use((req, _res, next) => {
      if (req.url && (req.url === '/dashboard/dashboard.html' || req.url.startsWith('/dashboard/dashboard.html?'))) {
        const queryIndex = req.url.indexOf('?');
        const query = queryIndex >= 0 ? req.url.slice(queryIndex) : '';
        req.url = `/index.html${query}`;
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), dashboardSpaMiddleware()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
});
