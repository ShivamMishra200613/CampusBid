/**
 * Resolves the Socket.IO server connection URL based on environment variables.
 *
 * Rules:
 * 1. If VITE_SOCKET_URL is set, use its origin (e.g. "https://campusbid.onrender.com").
 * 2. If VITE_API_URL is an absolute HTTP/HTTPS URL (e.g. "https://campusbid.onrender.com/api/v1" or with trailing slash),
 *    extract its origin only ("https://campusbid.onrender.com"), stripping any path like "/api/v1".
 * 3. If VITE_API_URL is relative (e.g. "/api/v1", standard for local Vite proxy and Docker Nginx reverse proxy),
 *    return "/" so Socket.IO connects through the same origin reverse proxy.
 *
 * @param {Object} [env] - Environment object (defaults to runtime window.__ENV__ or build-time import.meta.env)
 * @returns {string} Clean Socket.IO origin URL or "/"
 */
export function resolveSocketUrl(env) {
  const sourceEnv =
    env ||
    (typeof window !== 'undefined' && window.__ENV__) ||
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {});

  const safeEnv = sourceEnv && typeof sourceEnv === 'object' ? sourceEnv : {};
  const customSocketUrl = safeEnv.VITE_SOCKET_URL?.trim();
  if (customSocketUrl) {
    if (customSocketUrl.startsWith('http://') || customSocketUrl.startsWith('https://')) {
      try {
        return new URL(customSocketUrl).origin;
      } catch {
        return customSocketUrl.replace(/\/+$/, '');
      }
    }
    return customSocketUrl.replace(/\/+$/, '');
  }

  const apiUrl = safeEnv.VITE_API_URL?.trim();
  if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      return '/';
    }
  }

  return '/';
}
