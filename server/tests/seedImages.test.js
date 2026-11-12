import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedFilePath = path.resolve(__dirname, '../src/scripts/seed.js');

/**
 * Extracts all image URLs defined inside `images: [ ... ]` arrays in seed.js
 */
function extractSeedImageUrls(content) {
  const imagesBlockRegex = /images:\s*\[([\s\S]*?)\]/g;
  const urls = [];
  let blockMatch;

  while ((blockMatch = imagesBlockRegex.exec(content)) !== null) {
    const blockContent = blockMatch[1];
    const urlMatches = blockContent.matchAll(/'([^']+)'|"([^"]+)"/g);
    for (const match of urlMatches) {
      urls.push(match[1] || match[2]);
    }
  }

  return urls;
}

/**
 * Performs an HTTP HEAD request against an image URL to verify reachability and content type.
 */
function checkImageUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'CampusBid-Seed-Image-Checker/1.0'
        }
      },
      (res) => {
        resolve({
          statusCode: res.statusCode,
          contentType: res.headers['content-type']
        });
      }
    );

    req.on('error', (err) => reject(new Error(`Failed to request ${url}: ${err.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout requesting ${url}`));
    });
    req.end();
  });
}

describe('Seed Data Image Reachability Tests', () => {
  const seedContent = fs.readFileSync(seedFilePath, 'utf8');
  const imageUrls = extractSeedImageUrls(seedContent);

  test('1. Seed script defines image URLs for products', () => {
    assert.ok(imageUrls.length > 0, 'No image URLs found in seed.js');
    assert.equal(imageUrls.length, 8, 'Expected 8 seeded product image URLs');
  });

  test('2. All seed image URLs use HTTPS and not local /uploads paths', () => {
    for (const url of imageUrls) {
      assert.ok(url.startsWith('https://'), `Seed image URL "${url}" must use HTTPS protocol`);
      assert.ok(
        !url.includes('/uploads/'),
        `Seed image URL "${url}" must not use local /uploads path`
      );
    }
  });

  test('3. Every seed image URL is reachable and returns HTTP 200 with an image content type', async () => {
    const results = await Promise.all(
      imageUrls.map(async (url) => {
        const { statusCode, contentType } = await checkImageUrl(url);
        return { url, statusCode, contentType };
      })
    );

    for (const { url, statusCode, contentType } of results) {
      assert.equal(statusCode, 200, `Expected 200 OK for seed image ${url}, got ${statusCode}`);
      assert.ok(
        contentType && contentType.startsWith('image/'),
        `Expected image content-type for ${url}, got ${contentType}`
      );
    }
  });
});
