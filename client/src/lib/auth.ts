import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  isAdmin: boolean;
  isActive: boolean;
}

export interface LoginResponse {
  user: AuthUser;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  console.log('🔐 Login attempt:', {
    username,
    url: '/api/auth/login',
    timestamp: new Date().toISOString(),
    currentDomain: window.location.hostname,
    currentOrigin: window.location.origin
  });
  
  // Add timestamp to prevent caching
  const timestamp = Date.now();
  const response = await apiRequest(`/api/auth/login?t=${timestamp}`, "POST", { username, password });
  const result = await response.json();
  
  console.log('🔐 Login response:', {
    success: !!result.user,
    user: result.user,
    timestamp: new Date().toISOString()
  });
  
  return result;
}

export async function getCurrentUser(userId: string): Promise<{ user: AuthUser }> {
  const response = await apiRequest(`/api/auth/user?userId=${userId}`, "GET");
  return await response.json();
}

export function setAuthUser(user: AuthUser): void {
  localStorage.setItem("authUser", JSON.stringify(user));
}

export function getAuthUser(): AuthUser | null {
  const stored = localStorage.getItem("authUser");
  return stored ? JSON.parse(stored) : null;
}

export function clearAuthUser(): void {
  localStorage.removeItem("authUser");
}