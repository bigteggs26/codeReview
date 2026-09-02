import { User, AdminEntry } from '../types';

export const PRIMARY_OWNER_EMAIL = 'bigteggs26@gmail.com';
export const PRIMARY_OWNER_EMAILS = [
  'bigteggs26@gmail.com',
  'admin@codescore.dev',
];
export const STORAGE_KEY_ADMIN_LIST = 'codescore_portal_admin_whitelist_v1';
export const STORAGE_KEY_AUTH_SESSION = 'codescore_portal_auth_session_v1';

export const INITIAL_ADMINS: AdminEntry[] = [
  {
    id: 'admin-owner-google',
    email: 'bigteggs26@gmail.com',
    name: 'Lead Administrator',
    role: 'super_admin',
    addedAt: '2026-08-30T00:00:00Z',
    addedBy: 'System (Primary Owner)',
    isPrimaryOwner: true,
  },
  {
    id: 'admin-owner-internal',
    email: 'admin@codescore.dev',
    name: 'Platform Administrator',
    role: 'super_admin',
    addedAt: '2026-08-30T00:00:00Z',
    addedBy: 'System (Primary Owner)',
    isPrimaryOwner: true,
  },
];

export const DEFAULT_ADMIN_LIST = INITIAL_ADMINS;

// Helper to check if an email belongs to a primary owner
export function isPrimaryOwner(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return PRIMARY_OWNER_EMAILS.some((ownerEmail) => ownerEmail.toLowerCase() === normalized);
}

// Helper to check if an email is an authorized admin
export function isEmailAdmin(email: string, adminList: AdminEntry[] = []): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (isPrimaryOwner(normalized)) return true;
  return adminList.some((a) => a.email?.trim().toLowerCase() === normalized);
}

// Generate an avatar URL based on email/name
export function getAvatarUrl(name: string, email: string): string {
  const seed = encodeURIComponent(email || name || 'user');
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}
