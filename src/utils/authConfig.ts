import { User, AdminEntry } from '../types';

export const PRIMARY_OWNER_EMAIL = 'admin@codescore.dev';
export const MASTER_ADMIN_PASSCODES = ['ADMIN777', 'ROOT999'];
export const STORAGE_KEY_ADMIN_LIST = 'codescore_portal_admin_whitelist_v1';
export const STORAGE_KEY_AUTH_SESSION = 'codescore_portal_auth_session_v1';

// Helper to verify an admin passcode
export function isValidAdminCode(code: string): boolean {
  if (!code) return false;
  const clean = code.trim().toUpperCase();
  return MASTER_ADMIN_PASSCODES.includes(clean);
}

export const INITIAL_ADMINS: AdminEntry[] = [
  {
    id: 'admin-owner',
    email: PRIMARY_OWNER_EMAIL,
    name: 'Lead Administrator',
    role: 'super_admin',
    addedAt: '2026-08-30T00:00:00Z',
    addedBy: 'System (Primary Owner)',
    isPrimaryOwner: true,
  },
];

export const DEFAULT_ADMIN_LIST = INITIAL_ADMINS;

// Helper to check if an email is an authorized admin
export function isEmailAdmin(email: string, adminList: AdminEntry[]): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === PRIMARY_OWNER_EMAIL.toLowerCase()) return true;
  return adminList.some((a) => a.email.trim().toLowerCase() === normalized);
}

// Generate an avatar URL based on email/name
export function getAvatarUrl(name: string, email: string): string {
  const seed = encodeURIComponent(email || name || 'user');
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}
