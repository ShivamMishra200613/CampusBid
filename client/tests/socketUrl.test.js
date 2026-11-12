import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSocketUrl } from '../src/utils/socketUrl.js';

describe('resolveSocketUrl', () => {
  it('returns "/" when VITE_API_URL is relative ("/api/v1")', () => {
    assert.equal(resolveSocketUrl({ VITE_API_URL: '/api/v1' }), '/');
  });

  it('derives origin when VITE_API_URL is an absolute HTTPS URL without trailing slash', () => {
    assert.equal(
      resolveSocketUrl({ VITE_API_URL: 'https://campusbid.onrender.com/api/v1' }),
      'https://campusbid.onrender.com'
    );
  });

  it('derives origin when VITE_API_URL is an absolute HTTPS URL with trailing slash', () => {
    assert.equal(
      resolveSocketUrl({ VITE_API_URL: 'https://campusbid.onrender.com/api/v1/' }),
      'https://campusbid.onrender.com'
    );
  });

  it('derives origin when VITE_API_URL is an HTTP localhost URL with port and path', () => {
    assert.equal(
      resolveSocketUrl({ VITE_API_URL: 'http://localhost:5000/api/v1' }),
      'http://localhost:5000'
    );
  });

  it('prefers VITE_SOCKET_URL over VITE_API_URL when both are provided', () => {
    assert.equal(
      resolveSocketUrl({
        VITE_SOCKET_URL: 'https://custom-socket.example.com',
        VITE_API_URL: 'https://campusbid.onrender.com/api/v1'
      }),
      'https://custom-socket.example.com'
    );
  });

  it('strips trailing slashes and paths from VITE_SOCKET_URL', () => {
    assert.equal(
      resolveSocketUrl({ VITE_SOCKET_URL: 'https://campusbid.onrender.com/' }),
      'https://campusbid.onrender.com'
    );
    assert.equal(
      resolveSocketUrl({ VITE_SOCKET_URL: 'https://campusbid.onrender.com/socket.io' }),
      'https://campusbid.onrender.com'
    );
  });

  it('trims leading/trailing whitespace from environment variables', () => {
    assert.equal(
      resolveSocketUrl({ VITE_API_URL: '   https://campusbid.onrender.com/api/v1   ' }),
      'https://campusbid.onrender.com'
    );
  });

  it('reads from global window.__ENV__ when no env argument is provided', () => {
    globalThis.window = {
      __ENV__: { VITE_API_URL: 'https://campusbid.onrender.com/api/v1' }
    };
    assert.equal(resolveSocketUrl(), 'https://campusbid.onrender.com');
    delete globalThis.window;
  });

  it('returns "/" when env is empty, undefined, or missing keys', () => {
    assert.equal(resolveSocketUrl({}), '/');
    assert.equal(resolveSocketUrl(null), '/');
    assert.equal(resolveSocketUrl(undefined), '/');
    assert.equal(resolveSocketUrl(), '/');
  });

  it('returns "/" for malformed or non-http URLs', () => {
    assert.equal(resolveSocketUrl({ VITE_API_URL: 'invalid-url' }), '/');
    assert.equal(resolveSocketUrl({ VITE_API_URL: 'ws://not-http.example.com' }), '/');
  });
});
