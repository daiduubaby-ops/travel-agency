const crypto = require('crypto');

// AES-256-GCM helper utilities
// Key is derived from ENCRYPTION_KEY env var (can be any passphrase);
// we derive a 32-byte key using sha256 so callers can provide a passphrase.
const KEY = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'fallback-encryption-key').digest();

function encrypt(plain) {
  if (plain === undefined || plain === null) return plain;
  const iv = crypto.randomBytes(12); // 96-bit recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // store as base64 iv:tag:cipher
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

function decrypt(enc) {
  if (enc === undefined || enc === null) return enc;
  try {
    const data = Buffer.from(enc, 'base64');
    const iv = data.slice(0, 12);
    const tag = data.slice(12, 28);
    const ciphertext = data.slice(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plain.toString('utf8');
  } catch (e) {
    // if decryption fails, return original value to avoid breaking on already-plaintext data
    return enc;
  }
}

function hmac(value) {
  if (value === undefined || value === null) return value;
  return crypto.createHmac('sha256', KEY).update(String(value)).digest('hex');
}

module.exports = { encrypt, decrypt, hmac };
