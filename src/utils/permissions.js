import authService from '../services/auth.service';

/**
 * Role-based permission system
 * 
 * super - Full access to everything
 * health - Health services only
 * safety - Safety services only
 * welfare - Welfare services only
 * disaster - Disaster management only
 * youth - Red Cross Youth only
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

export const hasPermission = (module) => {
  const user = authService.getCurrentUser();
  
  if (!user || !user.admin_role) {
    return false;
  }

  const role = user.admin_role;
  const permissions = ROLE_PERMISSIONS[role];

  if (!permissions) {
    return false;
  }

  // Super admin has access to everything
  if (permissions.canAccessAll) {
    return true;
  }

  // Check if module is in the allowed list
  return permissions.modules.includes(module);
};

export const isSuperAdmin = () => {
  const user = authService.getCurrentUser();
  return user?.admin_role === 'super';
};

export const getUserRole = () => {
  const user = authService.getCurrentUser();
  return user?.admin_role || null;
};

export const getRoleLabel = (role) => {
  const labels = {
    super: 'Super Administrator',
    health: 'Health Services',
    safety: 'Safety Services',
    welfare: 'Welfare Services',
    disaster: 'Disaster Management',
    youth: 'Red Cross Youth'
  };
  return labels[role] || role;
};

// Filter data based on user's role
export const filterByRole = (items, roleField = 'service') => {
  const user = authService.getCurrentUser();
  
  if (!user || !user.admin_role) {
    return [];
  }

  // Super admin sees everything
  if (user.admin_role === 'super') {
    return items;
  }

  // Other admins only see their service area
  return items.filter(item => {
    // If item has no role/service field, show it
    if (!item[roleField]) {
      return true;
    }
    
    // Match admin role with item's service area
    return item[roleField] === user.admin_role;
  });
};

export default {
  hasPermission,
  isSuperAdmin,
  getUserRole,
  getRoleLabel,
  filterByRole
};
