export const hasPermission = (user, permissionName) => {
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
