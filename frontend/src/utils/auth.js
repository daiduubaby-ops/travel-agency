/**
 * Auth utility for managing user session and roles
 */

export const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error('Error parsing user from localStorage', e);
    return null;
  }
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const isLoggedIn = () => {
  return !!getToken() && !!getUser();
};

export const isAdmin = () => {
  const user = getUser();
  return !!(user && user.role === 'admin');
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Optional: clear other app-specific local storage
  localStorage.removeItem('sampleBookings');
  window.location.href = '/';
};

export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Redirects based on auth state and role
 */
export const guardRoute = (requireAuth = false, requireAdmin = false) => {
  const loggedIn = isLoggedIn();
  const admin = isAdmin();

  if (requireAuth && !loggedIn) {
    window.location.href = '/login';
    return false;
  }

  if (requireAdmin && !admin) {
    window.location.href = '/';
    return false;
  }

  return true;
};
