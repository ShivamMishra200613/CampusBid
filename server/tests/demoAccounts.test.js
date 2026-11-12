import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import { seedDatabase } from '../src/scripts/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const readmePath = path.resolve(__dirname, '../../README.md');

/**
 * Parses the Seeded Demo Accounts table from README.md
 * and extracts all listed email addresses.
 */
function parseReadmeDemoEmails(content) {
  const sectionMatch = content.match(/## Seeded Demo Accounts[\s\S]*?(?=\n---|\n## |$)/);
  if (!sectionMatch) {
    throw new Error('Could not find "## Seeded Demo Accounts" section in README.md');
  }

  const sectionText = sectionMatch[0];
  const emailRegex = /`([a-zA-Z0-9._%+-]+@ves\.ac\.in)`/g;
  const emails = [];
  let match;

  while ((match = emailRegex.exec(sectionText)) !== null) {
    emails.push(match[1]);
  }

  return emails;
}

describe('Demo Accounts Documentation & Seed Parity Tests', () => {
  let seededUsers = [];
  let readmeEmails = [];

  before(async () => {
    await connectDB();
    const seedResult = await seedDatabase();
    seededUsers = seedResult.users;

    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    readmeEmails = parseReadmeDemoEmails(readmeContent);
  });

  after(async () => {
    await disconnectDB();
  });

  test('1. README.md contains a populated Seeded Demo Accounts table', () => {
    assert.ok(readmeEmails.length > 0, 'README.md must list demo accounts');
    assert.equal(readmeEmails.length, 6, 'README.md must list exactly 6 seeded accounts');
  });

  test('2. Every demo account email listed in README.md is created by the seed script', () => {
    const seededEmails = new Set(seededUsers.map((u) => u.email));

    for (const email of readmeEmails) {
      assert.ok(
        seededEmails.has(email),
        `README demo account "${email}" was not created by the seed script!`
      );
    }
  });

  test('3. Every user created by the seed script is documented in README.md', () => {
    const readmeEmailSet = new Set(readmeEmails);

    for (const user of seededUsers) {
      assert.ok(
        readmeEmailSet.has(user.email),
        `Seeded user "${user.email}" is missing from the README.md demo accounts table!`
      );
    }
  });

  test('4. sneha.k@ves.ac.in is seeded as suspended for 403 test verification', () => {
    const sneha = seededUsers.find((u) => u.email === 'sneha.k@ves.ac.in');
    assert.ok(sneha, 'sneha.k@ves.ac.in must be seeded');
    assert.equal(
      sneha.isSuspended,
      true,
      'sneha.k@ves.ac.in must have isSuspended: true in database'
    );
  });
});
