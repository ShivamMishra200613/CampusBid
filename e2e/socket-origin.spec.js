import { test, expect } from '@playwright/test';

test.describe('Socket.IO Target Origin Verification', () => {
  test('with an absolute VITE_API_URL, no /socket.io request goes to the client origin', async ({
    page,
    baseURL
  }) => {
    const clientUrl = new URL(baseURL || 'http://localhost:5173');
    const clientHost = clientUrl.host;
    const backendOrigin = 'http://localhost:5001';

    const clientSocketEndpoints = [];
    const backendSocketEndpoints = [];

    // Capture HTTP polling requests
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/socket.io/')) {
        const parsed = new URL(url);
        if (parsed.host === clientHost) {
          clientSocketEndpoints.push(url);
        } else if (parsed.origin === backendOrigin) {
          backendSocketEndpoints.push(url);
        }
      }
    });

    // Capture WebSocket connections
    page.on('websocket', (ws) => {
      const url = ws.url();
      if (url.includes('/socket.io/')) {
        const parsed = new URL(url);
        if (parsed.host === clientHost) {
          clientSocketEndpoints.push(url);
        } else if (parsed.host === 'localhost:5001') {
          backendSocketEndpoints.push(url);
        }
      }
    });

    // Inject absolute VITE_API_URL before the client application initializes
    await page.addInitScript(
      ({ targetBackend }) => {
        window.__ENV__ = {
          VITE_API_URL: `${targetBackend}/api/v1`
        };
      },
      { targetBackend: backendOrigin }
    );

    // Wait for websocket connection to backend
    const socketConnectedPromise = page.waitForEvent('websocket', (ws) =>
      ws.url().includes('localhost:5001/socket.io/')
    );

    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();

    await socketConnectedPromise;

    // Verify:
    // 1. Socket.IO connected to backend origin (http://localhost:5001)
    expect(backendSocketEndpoints.length).toBeGreaterThan(0);

    // 2. ABSOLUTELY ZERO /socket.io requests or websockets were directed to the client origin
    expect(clientSocketEndpoints).toHaveLength(0);
  });

  test('with production Render VITE_API_URL, socket targets Render origin and zero socket requests go to client origin', async ({
    page,
    baseURL
  }) => {
    const clientUrl = new URL(baseURL || 'http://localhost:5173');
    const clientHost = clientUrl.host;
    const renderHost = 'campusbid.onrender.com';

    const clientSocketEndpoints = [];
    const renderSocketEndpoints = [];

    // Capture HTTP polling requests
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/socket.io/')) {
        const parsed = new URL(url);
        if (parsed.host === clientHost) {
          clientSocketEndpoints.push(url);
        } else if (parsed.host === renderHost) {
          renderSocketEndpoints.push(url);
        }
      }
    });

    // Capture WebSocket connections
    page.on('websocket', (ws) => {
      const url = ws.url();
      if (url.includes('/socket.io/')) {
        const parsed = new URL(url);
        if (parsed.host === clientHost) {
          clientSocketEndpoints.push(url);
        } else if (parsed.host === renderHost) {
          renderSocketEndpoints.push(url);
        }
      }
    });

    // Inject production Render absolute VITE_API_URL
    await page.addInitScript(() => {
      window.__ENV__ = {
        VITE_API_URL: 'https://campusbid.onrender.com/api/v1'
      };
    });

    const renderSocketAttempt = page.waitForEvent('websocket', (ws) =>
      ws.url().includes('campusbid.onrender.com/socket.io/')
    );

    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();

    await renderSocketAttempt;

    // Verify:
    // 1. Socket.IO connection was initiated to Render origin
    expect(renderSocketEndpoints.length).toBeGreaterThan(0);

    // 2. Zero /socket.io requests or websockets were sent to client origin
    expect(clientSocketEndpoints).toHaveLength(0);
  });
});
