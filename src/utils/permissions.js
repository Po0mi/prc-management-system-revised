import authService from '../services/auth.service';

/**
 * Role-based permission system.
 * Backend stores roles as: super_admin, health_admin, safety_admin,
 * welfare_admin, disaster_admin, youth_admin, user.
 * We extract the service prefix (e.g. "safety_admin" → "safety").
 */

const ROLE_PERMISSIONS = {
  super: {
    canAccessAll: true,
    modules: ['*']
  },
  health: {
    canAccessAll: false,
    modules: ['events', 'announcements', 'volunteers', 'training', 'blood-bank']
  },
  safety: {
    canAccessAll: false,
    modules: ['events', 'announcements', 'volunteers', 'training']
  },
  welfare: {
    canAccessAll: false,
    modules: ['events', 'announcements', 'volunteers', 'donations']
  },
  disaster: {
    canAccessAll: false,
    modules: ['events', 'announcements', 'volunteers', 'training', 'inventory']
  },
  youth: {
    canAccessAll: false,
    modules: ['events', 'announcements', 'volunteers', 'training']
  }
};

// Maps "super_admin" → "super", "safety_admin" → "safety", etc.
const extractRoleKey = (fullRole) => {
  if (!fullRole) return null;
  if (fullRole === 'super_admin') return 'super';
  const match = fullRole.match(/^(\w+)_admin$/);
  return match ? match[1] : null;
};

export const hasPermission = (module) => {
  const user = authService.getCurrentUser();
  if (!user?.role) return false;

  const roleKey = extractRoleKey(user.role);
  const permissions = roleKey ? ROLE_PERMISSIONS[roleKey] : null;
  if (!permissions) return false;
  if (permissions.canAccessAll) return true;
  return permissions.modules.includes(module);
};

export const isSuperAdmin = () => {
  const user = authService.getCurrentUser();
  return user?.role === 'super_admin';
};

export const getUserRole = () => {
  const user = authService.getCurrentUser();
  return extractRoleKey(user?.role);
};

export const getRoleLabel = (roleKey) => {
  const labels = {
    super:    'Super Administrator',
    health:   'Health Services',
    safety:   'Safety Services',
    welfare:  'Welfare Services',
    disaster: 'Disaster Management',
    youth:    'Red Cross Youth'
  };
  return labels[roleKey] || roleKey || 'Administrator';
};

export const filterByRole = (items, roleField = 'service') => {
  const user = authService.getCurrentUser();
  if (!user?.role) return [];

  const roleKey = extractRoleKey(user.role);
  if (!roleKey) return [];
  if (roleKey === 'super') return items;

  return items.filter(item => {
    if (!item[roleField]) return true;
    return item[roleField].toLowerCase() === roleKey.toLowerCase();
  });
};

export default {
  hasPermission,
  isSuperAdmin,
  getUserRole,
  getRoleLabel,
  filterByRole
};
