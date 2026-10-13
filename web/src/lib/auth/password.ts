import { compare, hash, hashSync } from 'bcryptjs';

// Laravel writes bcrypt hashes with the `$2y$` prefix; bcryptjs expects `$2b$`.
// The algorithm is identical, so existing user rows keep working.
export function verifyPassword(plain: string, hash: string) {
  return compare(plain, hash.replace(/^\$2y\$/, '$2b$'));
}

export function hashPassword(plain: string) {
  return hash(plain, 12);
}

// A real hash to compare against when the email is unknown, so response time
// doesn't reveal which emails exist.
export const DUMMY_HASH = hashSync(crypto.randomUUID(), 12);
