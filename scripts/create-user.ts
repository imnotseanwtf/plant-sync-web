/**
 * Create (or reset the password of) a dashboard user:
 *   bun run user:create "Jane Doe" jane@example.com 'a-strong-password'
 */
import { hashPassword } from '../src/lib/auth/password';
import { prisma } from '../src/lib/prisma';

const [name, rawEmail, password] = process.argv.slice(2);
if (!name || !rawEmail || !password || password.length < 8) {
  console.error('Usage: bun run user:create <name> <email> <password (min 8 chars)>');
  process.exit(1);
}

const email = rawEmail.trim().toLowerCase();
const hashed = await hashPassword(password);
const user = await prisma.user.upsert({
  where: { email },
  update: { name, password: hashed },
  create: { name, email, password: hashed },
  select: { id: true, email: true }
});
console.log(`User ${user.email} (id ${user.id}) is ready.`);
await prisma.$disconnect();
