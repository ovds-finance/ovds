#!/usr/bin/env node

/**
 * generate-license-keys.mjs
 *
 * Generates an RSA-2048 key pair for the offline license verification system.
 *
 * The private key is used to SIGN license strings at license-issuance time.
 * The public key is embedded in the application via OFFLINE_PUBLIC_KEY
 * to VERIFY signatures at runtime.
 *
 * Output:
 *   - scripts/.license-keys/private.pem   (keep secret — issuer only)
 *   - scripts/.license-keys/public.pem    (safe to embed in app config)
 *
 * Usage:
 *   node scripts/generate-license-keys.mjs
 *   node scripts/generate-license-keys.mjs --bits 4096
 *
 * Environment:
 *   OFFLINE_PUBLIC_KEY — if set, writes the public key to this env var
 *                            name for easy copy-paste into .env / CI secrets.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import path from 'node:path';

const args = process.argv.slice(2);
const bits = parseInt(args.find(a => a.startsWith('--bits='))?.split('=')[1] || '2048', 10);

const OUTPUT_DIR = path.resolve(process.cwd(), 'scripts', '.license-keys');

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`[license-keys] Generating RSA-${bits} key pair...`);

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: bits,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

const publicKeyPath = path.join(OUTPUT_DIR, 'public.pem');
const privateKeyPath = path.join(OUTPUT_DIR, 'private.pem');

writeFileSync(publicKeyPath, publicKey);
writeFileSync(privateKeyPath, privateKey);

console.log(`[license-keys] Public key written to:  ${publicKeyPath}`);
console.log(`[license-keys] Private key written to: ${privateKeyPath}`);
console.log('');
console.log('IMPORTANT: Keep the private key SECRET. Only the public key is embedded in the application.');
console.log('');
console.log('Public key (paste into OFFLINE_PUBLIC_KEY env var):');
console.log('---');
console.log(publicKey);
console.log('---');
console.log('');
console.log('To sign a license string (issuer-side):');
console.log('  node scripts/sign-license.mjs --license "LICENSE-KEY-STRING" --private-key scripts/.license-keys/private.pem');
