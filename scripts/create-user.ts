/**
 * Create (or reset the password of) a dashboard user:
 *   bun run user:create "Jane Doe" jane@example.com 'a-strong-password' [admin|operator|viewer]
 * The role defaults to admin (this script is the break-glass way to get an admin).
 */
import { hashPassword } from '../src/lib/auth/password';
import { ROLES, type Role } from '../src/lib/auth/rbac';
import { prisma } from '../src/lib/prisma';

const isRole = (value: string): value is Role => (ROLES as readonly string[]).includes(value);

const [name, rawEmail, password, role = 'admin'] = process.argv.slice(2);
if (!name || !rawEmail || !password || password.length < 8 || !isRole(role)) {
  console.error('Usage: bun run user:create <name> <email> <password (min 8 chars)> [admin|operator|viewer]');
  process.exit(1);
}

const email = rawEmail.trim().toLowerCase();
const hashed = await hashPassword(password);
const user = await prisma.user.upsert({
  where: { email },
  update: { name, role, password: hashed },
  create: { name, email, role, userType: 'admin', password: hashed },
  select: { id: true, email: true, role: true }
});
console.log(`User ${user.email} (id ${user.id}, ${user.role}) is ready.`);
await prisma.$disconnect();
