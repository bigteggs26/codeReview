import { User, AdminEntry } from '../types';

export const PRIMARY_OWNER_EMAIL = 'bigteggs26@gmail.com';
export const STORAGE_KEY_ADMIN_LIST = 'codescore_portal_admin_whitelist_v1';
export const STORAGE_KEY_AUTH_SESSION = 'codescore_portal_google_auth_session_v1';

export const INITIAL_ADMINS: AdminEntry[] = [
  {
    id: 'admin-owner',
    email: PRIMARY_OWNER_EMAIL,
    name: 'Portal Owner (Admin)',
    role: 'super_admin',
    addedAt: '2026-08-30T00:00:00Z',
    addedBy: 'System (Primary Owner)',
    isPrimaryOwner: true,
  },
  {
    id: 'admin-elena',
    email: 'elena@teamdev.internal',
    name: 'Elena Rostova',
    role: 'admin',
    addedAt: '2026-08-20T00:00:00Z',
    addedBy: PRIMARY_OWNER_EMAIL,
  },
  {
    id: 'admin-marcus',
    email: 'marcus@teamdev.internal',
    name: 'Marcus Vance',
    role: 'admin',
    addedAt: '2026-08-20T00:00:00Z',
    addedBy: PRIMARY_OWNER_EMAIL,
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

// Generate an avatar URL based on email/name if no Google picture is available
export function getAvatarUrl(name: string, email: string): string {
  const seed = encodeURIComponent(email || name || 'user');
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

// Decode Google JWT ID token
export function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT token:', e);
    return null;
  }
}
