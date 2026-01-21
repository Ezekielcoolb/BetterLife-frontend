export const ADMIN_TOKEN_STORAGE_KEY = "loanSystem.adminToken";
export const ADMIN_USER_STORAGE_KEY = "loanSystem.adminUser";

export function getStoredAdminAuth() {
  if (typeof window === "undefined") {
    return { token: null, admin: null };
  }

  const token = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  const rawAdmin = window.localStorage.getItem(ADMIN_USER_STORAGE_KEY);

  if (!rawAdmin) {
    return { token, admin: null };
  }

  try {
    const admin = JSON.parse(rawAdmin);
    return { token, admin };
  } catch (_error) {
    window.localStorage.removeItem(ADMIN_USER_STORAGE_KEY);
    return { token, admin: null };
  }
}

export function saveAdminAuth(token, admin) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(admin));
}

export function clearAdminAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(ADMIN_USER_STORAGE_KEY);
}
