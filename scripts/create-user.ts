/**
 * Create (or reset the password and roles of) a dashboard user:
 *   bun run user:create "Jane Doe" jane@example.com 'a-strong-password' [Role,Role]
 * Roles are names from the Roles screen; the default is Admin (this script is the break-glass
 * way to get an admin).
 */
import { hashPassword } from '../src/lib/auth/password';
import { prisma } from '../src/lib/prisma';

const [name, rawEmail, password, rawRoles = 'Admin'] = process.argv.slice(2);
if (!name || !rawEmail || !password || password.length < 8) {
  console.error('Usage: bun run user:create <name> <email> <password (min 8 chars)> [Role,Role]');
  process.exit(1);
}

const roleNames = rawRoles
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean);
const roles = await prisma.role.findMany({ where: { name: { in: roleNames } } });
const unknown = roleNames.filter((n) => !roles.some((r) => r.name === n));
if (roles.length === 0 || unknown.length > 0) {
  console.error(`Unknown role(s): ${(unknown.length ? unknown : roleNames).join(', ')}`);
  process.exit(1);
}

const email = rawEmail.trim().toLowerCase();
const hashed = await hashPassword(password);
const links = roles.map((role) => ({ roleId: role.id }));
const user = await prisma.user.upsert({
  where: { email },
  update: { name, password: hashed, roles: { deleteMany: {}, create: links } },
  create: { name, email, userType: 'admin', password: hashed, roles: { create: links } },
  select: { id: true, email: true }
});
console.log(`User ${user.email} (id ${user.id}, ${roles.map((r) => r.name).join(', ')}) is ready.`);
await prisma.$disconnect();
