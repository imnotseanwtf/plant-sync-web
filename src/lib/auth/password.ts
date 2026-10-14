import { compare, hash, hashSync } from 'bcryptjs';

// Laravel writes bcrypt hashes with the `$2y$` prefix; bcryptjs expects `$2b$`.
// The algorithm is identical, so existing user rows keep working.
export function verifyPassword(plain: string, hash: string) {
  return compare(plain, hash.replace(/^\$2y\$/, '$2b$'));
}

// Store hashes with Laravel's `$2y$` prefix. The algorithm is identical to `$2b$`, but PHP's
// password_verify (and so Laravel's Hash::check) rejects `$2b$`, which would lock users out of
// the Laravel app if you ever roll back.
export async function hashPassword(plain: string) {
  return (await hash(plain, 12)).replace(/^\$2[ab]\$/, '$2y$');
}

// A real hash to compare against when the email is unknown, so response time
// doesn't reveal which emails exist.
export const DUMMY_HASH = hashSync(crypto.randomUUID(), 12);
