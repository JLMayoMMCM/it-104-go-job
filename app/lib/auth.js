// Authentication utilities for protecting routes and handling unauthorized access

export const checkAuth = () => {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  try {
    // Parse JWT payload (simple base64 decode - not for production verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check if token is expired
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('authToken');
      return null;
    }
    
    return payload;
  } catch (error) {
    localStorage.removeItem('authToken');
    return null;
  }
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const redirectToUnauthorized = (router, currentPath, error = null) => {
  const params = new URLSearchParams();
  params.set('returnUrl', currentPath);
  if (error) {
    params.set('error', error);
  }
  
  router.push(`/unauthorized?${params.toString()}`);
};

export const requireAuth = (router, currentPath, requiredAccountTypes = null) => {
  const auth = checkAuth();
  
  if (!auth) {
    redirectToUnauthorized(router, currentPath, 'Please log in to access this page');
    return null;
  }
    // Check account type restrictions if specified
  if (requiredAccountTypes && !requiredAccountTypes.includes(auth.account_type_id)) {
    const accountTypeName = auth.account_type_id === 1 ? 'Employee' : 'Job Seeker';
    redirectToUnauthorized(
      router, 
      currentPath, 
      `This page requires a different account type. You are logged in as: ${accountTypeName}`
    );
    return null;
  }
  
  return auth;
};

// Account type constants
export const ACCOUNT_TYPES = {
  COMPANY: 1,
  JOB_SEEKER: 2
};
