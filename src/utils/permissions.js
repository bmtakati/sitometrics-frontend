const roleNames = (user) => {
  const raw = user?.role_names ?? user?.roles ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.map((role) => (typeof role === 'string' ? role : role?.name)).filter(Boolean);
};

export const isSuperAdmin = (user) => roleNames(user).includes('SUPERADMIN');

export const hasPermission = (user, permissionName) => {
  if (isSuperAdmin(user)) return true;

  const permissions = user?.permissions;

  if (Array.isArray(permissions?.flat)) {
    return permissions.flat.includes(permissionName);
  }

  if (Array.isArray(permissions)) {
    return permissions.includes(permissionName);
  }

  if (Array.isArray(permissions?.grouped)) {
    return permissions.grouped.some((group) =>
      Array.isArray(group?.permissions) && group.permissions.some((perm) => perm?.name === permissionName)
    );
  }

  return false;
};

export const hasAnyPermission = (user, permissionNames = []) => {
  return permissionNames.some((name) => hasPermission(user, name));
};

export const crudPermissions = (resource) => [
  `view-${resource}`,
  `add-${resource}`,
  `edit-${resource}`,
  `delete-${resource}`,
  `restore-${resource}`,
];
