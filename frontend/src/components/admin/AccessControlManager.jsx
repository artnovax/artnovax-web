import React, { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  KeyRound,
  MailPlus,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  addStaffAccess,
  clearPermissionOverride,
  getAccessCatalog,
  inviteStaff,
  listStaffAccess,
  setPermissionOverride,
  setStaffAccessExpiry,
  setStaffActive,
  setStaffRole,
} from '@/services/access';

const inputCls =
  'w-full rounded-lg ring-1 ring-ivory-300 bg-ivory px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-burgundy/40';

const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const formatDateTime = (value) => {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

const isPast = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
};

const overrideMapFor = (staff) =>
  Object.fromEntries((staff.overrides || []).map((item) => [item.permission, item]));

const AccessControlManager = ({ currentUserId }) => {
  const [catalog, setCatalog] = useState({ roles: [], permissions: [], rolePermissions: {} });
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [expanded, setExpanded] = useState({});
  const [newInvite, setNewInvite] = useState({ email: '', role: 'editor', accessExpiresAt: '' });
  const [newStaff, setNewStaff] = useState({ email: '', role: 'editor', accessExpiresAt: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextCatalog, nextStaff] = await Promise.all([
        getAccessCatalog(),
        listStaffAccess(),
      ]);
      setCatalog(nextCatalog || { roles: [], permissions: [], rolePermissions: {} });
      setStaff(nextStaff || []);
    } catch (loadError) {
      setError(loadError?.message || 'Could not load staff access settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const groupedPermissions = useMemo(() => {
    const groups = new Map();
    (catalog.permissions || []).forEach((permission) => {
      const key = permission.category || 'Other';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(permission);
    });
    return [...groups.entries()];
  }, [catalog.permissions]);

  const run = async (key, action) => {
    setBusyKey(key);
    setError('');
    try {
      await action();
      await load();
    } catch (actionError) {
      setError(actionError?.message || 'Access update failed.');
    } finally {
      setBusyKey('');
    }
  };

  const submitInvite = async (event) => {
    event.preventDefault();
    if (!newInvite.email.trim()) return;

    if (
      newInvite.role === 'admin' &&
      !window.confirm(
        'Administrator access includes publishing, destructive actions, payment controls and staff-access management. Invite this user as an administrator?',
      )
    ) return;

    await run('invite-staff', async () => {
      const result = await inviteStaff({
        email: newInvite.email.trim(),
        role: newInvite.role,
        accessExpiresAt: toIsoOrNull(newInvite.accessExpiresAt),
      });
      setNotice(
        result?.message ||
          `Invitation sent to ${newInvite.email.trim()}. They can use the email link to choose a password.`,
      );
      setNewInvite({ email: '', role: 'editor', accessExpiresAt: '' });
    });
  };

  const submitNewStaff = async (event) => {
    event.preventDefault();
    if (!newStaff.email.trim()) return;
    if (
      newStaff.role === 'admin' &&
      !window.confirm('Administrator access includes publishing, destructive actions, payment controls and staff-access management. Add this user as an administrator?')
    ) return;
    await run('add-staff', async () => {
      await addStaffAccess({
        email: newStaff.email.trim(),
        role: newStaff.role,
        accessExpiresAt: toIsoOrNull(newStaff.accessExpiresAt),
      });
      setNewStaff({ email: '', role: 'editor', accessExpiresAt: '' });
    });
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-burgundy" />
            <h3 className="font-serif-display text-burgundy text-[24px] font-semibold">
              Staff access control
            </h3>
          </div>
          <p className="mt-1 text-ink/60 text-[13px] max-w-[760px]">
            Manage CMS roles, block or restore staff access, and add temporary permission overrides. Publishing and destructive permissions are marked admin-only and cannot be granted to non-admin roles.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full ring-1 ring-burgundy/30 px-4 py-2 text-[13px] font-semibold text-burgundy hover:bg-burgundy/10 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 text-red-800 px-4 py-3 text-[13px]">
          {error}
        </div>
      )}

      {notice && (
        <div className="mt-4 rounded-xl bg-emerald-50 text-emerald-800 px-4 py-3 text-[13px]">
          {notice}
        </div>
      )}

      <form
        onSubmit={submitInvite}
        className="mt-6 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5"
      >
        <div className="flex items-center gap-2">
          <MailPlus className="w-4 h-4 text-burgundy" />
          <h4 className="font-semibold text-ink">Invite a new staff member</h4>
        </div>
        <p className="mt-1 text-[12px] text-ink/55">
          Creates the Supabase Authentication user, assigns their role, and emails a secure account-setup link. They choose their own password.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-3 items-end">
          <label>
            <span className="text-[11px] uppercase tracking-widest text-ink/60 font-semibold">Email</span>
            <input
              type="email"
              required
              value={newInvite.email}
              onChange={(event) => setNewInvite({ ...newInvite, email: event.target.value })}
              className={`${inputCls} mt-1`}
              placeholder="name@artnovax.org"
            />
          </label>
          <label>
            <span className="text-[11px] uppercase tracking-widest text-ink/60 font-semibold">Role</span>
            <select
              value={newInvite.role}
              onChange={(event) => setNewInvite({ ...newInvite, role: event.target.value })}
              className={`${inputCls} mt-1`}
            >
              {(catalog.roles || []).map((role) => (
                <option key={role.key} value={role.key}>{role.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-[11px] uppercase tracking-widest text-ink/60 font-semibold">Access expires</span>
            <input
              type="datetime-local"
              value={newInvite.accessExpiresAt}
              onChange={(event) => setNewInvite({ ...newInvite, accessExpiresAt: event.target.value })}
              className={`${inputCls} mt-1`}
            />
          </label>
          <button
            disabled={busyKey === 'invite-staff'}
            className="cta-btn inline-flex items-center justify-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13px] font-semibold hover:bg-burgundy-light disabled:opacity-50"
          >
            <MailPlus className="w-4 h-4" />
            {busyKey === 'invite-staff' ? 'Sending…' : 'Send invitation'}
          </button>
        </div>
      </form>

      <form
        onSubmit={submitNewStaff}
        className="mt-4 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-burgundy" />
          <h4 className="font-semibold text-ink">Add an existing Supabase user</h4>
        </div>
        <p className="mt-1 text-[12px] text-ink/55">
          Use this only for an account that already exists in Supabase Authentication, such as a previously invited or manually created user.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-3 items-end">
          <label>
            <span className="text-[11px] uppercase tracking-widest text-ink/60 font-semibold">Email</span>
            <input
              type="email"
              required
              value={newStaff.email}
              onChange={(event) => setNewStaff({ ...newStaff, email: event.target.value })}
              className={`${inputCls} mt-1`}
              placeholder="name@artnovax.org"
            />
          </label>
          <label>
            <span className="text-[11px] uppercase tracking-widest text-ink/60 font-semibold">Role</span>
            <select
              value={newStaff.role}
              onChange={(event) => setNewStaff({ ...newStaff, role: event.target.value })}
              className={`${inputCls} mt-1`}
            >
              {(catalog.roles || []).map((role) => (
                <option key={role.key} value={role.key}>{role.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-[11px] uppercase tracking-widest text-ink/60 font-semibold">Access expires</span>
            <input
              type="datetime-local"
              value={newStaff.accessExpiresAt}
              onChange={(event) => setNewStaff({ ...newStaff, accessExpiresAt: event.target.value })}
              className={`${inputCls} mt-1`}
            />
          </label>
          <button
            disabled={busyKey === 'add-staff'}
            className="cta-btn inline-flex items-center justify-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13px] font-semibold hover:bg-burgundy-light disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            Add access
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 px-4 py-12 text-center text-ink/60 text-[13px]">
            Loading staff access…
          </div>
        ) : staff.length === 0 ? (
          <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 px-4 py-12 text-center text-ink/60 text-[13px]">
            No staff roles have been assigned yet.
          </div>
        ) : (
          staff.map((person) => {
            const isSelf = person.user_id === currentUserId;
            const isExpanded = !!expanded[person.user_id];
            const overrides = overrideMapFor(person);
            const roleBase = new Set(catalog.rolePermissions?.[person.role] || []);
            const effective = new Set(person.effective_permissions || []);
            const configuredBlocked = person.configured_active === false;
            const expired = !configuredBlocked && isPast(person.access_expires_at);
            const cmsDisabled = !configuredBlocked && !expired && !effective.has('cms.access');

            return (
              <section
                key={person.user_id}
                className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Users className="w-4 h-4 text-burgundy" />
                        <div className="font-semibold text-ink break-all">{person.email}</div>
                        {isSelf && (
                          <span className="rounded-full bg-burgundy/10 text-burgundy px-2.5 py-1 text-[10.5px] font-semibold">You</span>
                        )}
                        {configuredBlocked && (
                          <span className="rounded-full bg-red-100 text-red-800 px-2.5 py-1 text-[10.5px] font-semibold">Blocked</span>
                        )}
                        {expired && (
                          <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[10.5px] font-semibold">Expired</span>
                        )}
                        {cmsDisabled && (
                          <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[10.5px] font-semibold">CMS access disabled</span>
                        )}
                        {person.active && effective.has('cms.access') && (
                          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[10.5px] font-semibold">Active</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-ink/55">
                        <span>Role: <b className="text-ink/70">{person.role_name || person.role}</b></span>
                        <span>Last sign-in: <b className="text-ink/70">{formatDateTime(person.last_sign_in_at)}</b></span>
                        <span>Global expiry: <b className="text-ink/70">{person.access_expires_at ? formatDateTime(person.access_expires_at) : 'No expiry'}</b></span>
                        <span>Effective permissions: <b className="text-ink/70">{effective.size}</b></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setExpanded((current) => ({ ...current, [person.user_id]: !isExpanded }))}
                        className="inline-flex items-center gap-1.5 rounded-full ring-1 ring-ivory-300 px-3 py-2 text-[12px] font-semibold text-ink/70 hover:bg-ivory-200"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Permissions
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        disabled={isSelf || busyKey === `active:${person.user_id}`}
                        onClick={() => run(`active:${person.user_id}`, () => setStaffActive(
                          person.user_id,
                          configuredBlocked,
                          configuredBlocked ? null : 'Blocked from the CMS by an administrator.',
                        ))}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold disabled:opacity-40 ${!configuredBlocked ? 'ring-1 ring-red-200 text-red-700 hover:bg-red-50' : 'bg-burgundy text-ivory hover:bg-burgundy-light'}`}
                      >
                        {!configuredBlocked ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {!configuredBlocked ? 'Block access' : 'Restore access'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-3">
                    <label>
                      <span className="text-[11px] uppercase tracking-widest text-ink/60 font-semibold">Role template</span>
                      <select
                        value={person.role}
                        disabled={isSelf || busyKey === `role:${person.user_id}`}
                        onChange={(event) => {
                          const nextRole = event.target.value;
                          if (
                            nextRole === 'admin' &&
                            person.role !== 'admin' &&
                            !window.confirm('Promote this user to Administrator? This grants publishing, destructive actions, payment controls and staff-access management.')
                          ) {
                            event.target.value = person.role;
                            return;
                          }
                          run(`role:${person.user_id}`, () => setStaffRole(person.user_id, nextRole));
                        }}
                        className={`${inputCls} mt-1 disabled:opacity-60`}
                      >
                        {(catalog.roles || []).map((role) => (
                          <option key={role.key} value={role.key}>{role.name}</option>
                        ))}
                      </select>
                      <p className="mt-1 text-[11px] text-ink/50">
                        {(catalog.roles || []).find((role) => role.key === person.role)?.description || ''}
                      </p>
                    </label>

                    <label>
                      <span className="text-[11px] uppercase tracking-widest text-ink/60 font-semibold">Global access expiry</span>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="datetime-local"
                          defaultValue={toLocalInput(person.access_expires_at)}
                          disabled={isSelf}
                          id={`expiry-${person.user_id}`}
                          className={`${inputCls} disabled:opacity-60`}
                        />
                        <button
                          type="button"
                          disabled={isSelf || busyKey === `expiry:${person.user_id}`}
                          onClick={() => {
                            const value = document.getElementById(`expiry-${person.user_id}`)?.value || '';
                            run(`expiry:${person.user_id}`, () => setStaffAccessExpiry(person.user_id, toIsoOrNull(value)));
                          }}
                          className="rounded-full ring-1 ring-burgundy/30 px-4 py-2 text-[12px] font-semibold text-burgundy hover:bg-burgundy/10 disabled:opacity-40"
                        >
                          <Clock3 className="w-3.5 h-3.5 inline mr-1" /> Save
                        </button>
                      </div>
                    </label>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-ivory-300 bg-ivory/60 p-5">
                    <div className="mb-4">
                      <h5 className="font-semibold text-ink">Effective permissions</h5>
                      <p className="mt-1 text-[11.5px] text-ink/55">
                        Inherit uses the role template. Allow/Deny creates a per-user override. An optional override expiry is useful for temporary project access.
                      </p>
                    </div>

                    <div className="space-y-5">
                      {groupedPermissions.map(([category, permissions]) => (
                        <div key={category}>
                          <div className="text-[11px] uppercase tracking-widest font-semibold text-burgundy mb-2">{category}</div>
                          <div className="rounded-xl ring-1 ring-ivory-300 overflow-hidden">
                            {permissions.map((permission) => {
                              const override = overrides[permission.key];
                              const overrideValue = override ? (override.allowed ? 'allow' : 'deny') : 'inherit';
                              const effectiveAllowed = effective.has(permission.key);
                              const baseAllowed = roleBase.has(permission.key);
                              const adminOnlyLocked = permission.admin_only && person.role !== 'admin';
                              const rowBusy = busyKey === `perm:${person.user_id}:${permission.key}`;

                              const updateOverride = async (nextValue, nextExpiry = override?.expires_at || null) => {
                                const key = `perm:${person.user_id}:${permission.key}`;
                                if (nextValue === 'inherit') {
                                  await run(key, () => clearPermissionOverride(person.user_id, permission.key));
                                } else {
                                  await run(key, () => setPermissionOverride({
                                    userId: person.user_id,
                                    permission: permission.key,
                                    allowed: nextValue === 'allow',
                                    expiresAt: nextExpiry,
                                  }));
                                }
                              };

                              return (
                                <div
                                  key={permission.key}
                                  className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_120px_150px_190px] gap-3 items-center px-3 py-3 border-b border-ivory-300 last:border-b-0"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-[12.5px] text-ink">{permission.name}</span>
                                      <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${effectiveAllowed ? 'bg-emerald-100 text-emerald-800' : 'bg-ivory-300 text-ink/60'}`}>
                                        {effectiveAllowed ? 'Allowed' : 'Denied'}
                                      </span>
                                      {permission.admin_only && (
                                        <span className="rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-[9.5px] font-semibold">Admin-only</span>
                                      )}
                                    </div>
                                    <div className="mt-0.5 text-[11px] text-ink/50">{permission.description}</div>
                                  </div>

                                  <div className="text-[11px] text-ink/55">
                                    Role: <b>{baseAllowed ? 'Allow' : 'Deny'}</b>
                                  </div>

                                  <select
                                    value={overrideValue}
                                    disabled={rowBusy || adminOnlyLocked || (isSelf && ['access.manage', 'cms.access'].includes(permission.key))}
                                    onChange={(event) => updateOverride(event.target.value)}
                                    className={`${inputCls} disabled:opacity-55`}
                                    title={adminOnlyLocked ? 'Admin-only permissions cannot be granted to non-admin roles.' : ''}
                                  >
                                    <option value="inherit">Inherit</option>
                                    <option value="allow">Allow</option>
                                    <option value="deny">Deny</option>
                                  </select>

                                  <div>
                                    <input
                                      type="datetime-local"
                                      defaultValue={toLocalInput(override?.expires_at)}
                                      disabled={!override || rowBusy || adminOnlyLocked}
                                      onBlur={(event) => {
                                        if (!override) return;
                                        updateOverride(override.allowed ? 'allow' : 'deny', toIsoOrNull(event.target.value));
                                      }}
                                      className={`${inputCls} disabled:opacity-45`}
                                      title="Optional override expiry"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AccessControlManager;
