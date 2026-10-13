import { supabase } from '@/lib/supabase';

export const hasPermission = (access, permission) =>
  Boolean(access?.active && Array.isArray(access?.permissions) && access.permissions.includes(permission));

const unwrapRpc = (data, error, fallback) => {
  if (error) throw error;
  return data ?? fallback;
};

export async function getMySiteAccess() {
  const { data, error } = await supabase.rpc('get_my_site_access');
  return unwrapRpc(data, error, {
    active: false,
    role: null,
    roleName: null,
    accessExpiresAt: null,
    permissions: [],
  });
}

export async function getAccessCatalog() {
  const { data, error } = await supabase.rpc('admin_get_access_catalog');
  return unwrapRpc(data, error, { roles: [], permissions: [], rolePermissions: {} });
}

export async function listStaffAccess() {
  const { data, error } = await supabase.rpc('admin_list_staff_access');
  return unwrapRpc(data, error, []);
}


export async function inviteStaff({ email, role, accessExpiresAt = null }) {
  const { data, error } = await supabase.functions.invoke('invite-staff', {
    body: {
      email,
      role,
      access_expires_at: accessExpiresAt || null,
    },
  });

  if (error) {
    let message = error.message || 'Staff invitation failed.';
    try {
      const payload = await error?.context?.json?.();
      message = payload?.error || message;
    } catch {
      // Keep the Functions client error when no JSON payload is available.
    }
    throw new Error(message);
  }

  if (data?.error) throw new Error(data.error);
  return data;
}

export async function addStaffAccess({ email, role, accessExpiresAt = null }) {
  const { data, error } = await supabase.rpc('admin_add_staff_access', {
    p_email: email,
    p_role: role,
    p_access_expires_at: accessExpiresAt || null,
  });
  return unwrapRpc(data, error, null);
}

export async function setStaffRole(userId, role) {
  const { data, error } = await supabase.rpc('admin_set_staff_role', {
    p_user_id: userId,
    p_role: role,
  });
  return unwrapRpc(data, error, null);
}

export async function setStaffActive(userId, active, reason = null) {
  const { data, error } = await supabase.rpc('admin_set_staff_active', {
    p_user_id: userId,
    p_active: Boolean(active),
    p_reason: reason || null,
  });
  return unwrapRpc(data, error, null);
}

export async function setStaffAccessExpiry(userId, accessExpiresAt = null) {
  const { data, error } = await supabase.rpc('admin_set_staff_access_expiry', {
    p_user_id: userId,
    p_access_expires_at: accessExpiresAt || null,
  });
  return unwrapRpc(data, error, null);
}

export async function setPermissionOverride({
  userId,
  permission,
  allowed,
  expiresAt = null,
  note = null,
}) {
  const { data, error } = await supabase.rpc('admin_set_permission_override', {
    p_user_id: userId,
    p_permission: permission,
    p_allowed: Boolean(allowed),
    p_expires_at: expiresAt || null,
    p_note: note || null,
  });
  return unwrapRpc(data, error, null);
}

export async function clearPermissionOverride(userId, permission) {
  const { data, error } = await supabase.rpc('admin_clear_permission_override', {
    p_user_id: userId,
    p_permission: permission,
  });
  return unwrapRpc(data, error, null);
}
