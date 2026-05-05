import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const server = await readFile('supabase/functions/server/index.ts', 'utf8');
const routes = await readFile('src/app/routes.tsx', 'utf8');
const envExample = await readFile('.env.example', 'utf8');

assert.doesNotMatch(server, /auth\/signup/, 'admin signup endpoint must not exist in production build');
assert.doesNotMatch(routes, /admin\/signup/, 'public admin signup route must not be registered');
assert.match(server, /enforcePublicWriteGuard/, 'public write endpoints must use rate limiting');
assert.match(server, /honeypot/i, 'public write endpoints must include honeypot checks');
assert.match(envExample, /SENTRY_DSN=/, 'Sentry DSN must be documented in .env.example');
assert.match(server, /backup/i, 'backup/restore operational endpoints or docs must be represented');

console.log('Production guard tests passed.');
