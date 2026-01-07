import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "./query-client";

const TOKEN_KEY = "@fitcoach_auth_token";
const USER_KEY = "@fitcoach_auth_user";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "CLIENT" | "ADMIN";
  onboardingCompleted: boolean;
}

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setToken(token: string): Promise<void> {
  cachedToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  cachedToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const data = await AsyncStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export async function setStoredUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function apiRequest<T>(
  method: string,
  endpoint: string,
  data?: unknown,
  requiresAuth = true
): Promise<T> {
  const baseUrl = getApiUrl();
  const url = new URL(endpoint, baseUrl);
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (requiresAuth) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  
  const res = await fetch(url.href, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `Request failed: ${res.status}`);
  }
  
  return res.json();
}

export async function apiLogin(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const result = await apiRequest<{ token: string; user: AuthUser }>(
    "POST",
    "/api/auth/login",
    { email, password },
    false
  );
  await setToken(result.token);
  await setStoredUser(result.user);
  return result;
}

export async function apiRegister(email: string, password: string, name: string): Promise<{ token: string; user: AuthUser }> {
  const result = await apiRequest<{ token: string; user: AuthUser }>(
    "POST",
    "/api/auth/register",
    { email, password, name, role: "CLIENT" },
    false
  );
  await setToken(result.token);
  await setStoredUser(result.user);
  return result;
}

export async function apiGetMe(): Promise<AuthUser | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    return await apiRequest<AuthUser>("GET", "/api/auth/me");
  } catch {
    return null;
  }
}

export async function apiLogout(): Promise<void> {
  await clearToken();
}

export async function apiGetLocations(includeInactive = false) {
  const endpoint = includeInactive ? "/api/locations?includeInactive=true" : "/api/locations";
  return apiRequest<Array<{ id: string; name: string; address: string; isActive: boolean }>>("GET", endpoint);
}

export async function apiGetAvailability(date?: string, branchId?: string) {
  let endpoint = "/api/availability";
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (branchId) params.append("branchId", branchId);
  if (params.toString()) endpoint += `?${params.toString()}`;
  return apiRequest<Array<any>>("GET", endpoint);
}

export async function apiGetAvailableSlots(date: string, branchId?: string) {
  let endpoint = `/api/availability/slots?date=${date}`;
  if (branchId) endpoint += `&branchId=${branchId}`;
  return apiRequest<Array<{ startTime: string; endTime: string; branchId: string; branchName: string; blockId: string }>>("GET", endpoint);
}

export async function apiGetAvailableDates(branchId?: string) {
  let endpoint = "/api/availability/dates";
  if (branchId) endpoint += `?branchId=${branchId}`;
  return apiRequest<string[]>("GET", endpoint);
}

export async function apiGetBookings(date?: string, userId?: string) {
  let endpoint = "/api/bookings";
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (userId) params.append("userId", userId);
  if (params.toString()) endpoint += `?${params.toString()}`;
  return apiRequest<Array<any>>("GET", endpoint);
}

export async function apiCreateBooking(date: string, startTime: string, branchId: string, branchName: string, manualClientName?: string) {
  return apiRequest<any>("POST", "/api/bookings", { date, startTime, branchId, branchName, manualClientName });
}

export async function apiDeleteBooking(bookingId: string) {
  return apiRequest<{ success: boolean }>("DELETE", `/api/bookings/${bookingId}`);
}

export async function apiGetUsers() {
  return apiRequest<Array<{ id: string; email: string; name: string; role: string; onboardingCompleted: boolean; createdAt: string }>>("GET", "/api/users");
}

export async function apiGetUser(userId: string) {
  return apiRequest<{ id: string; email: string; name: string; role: string; onboardingCompleted: boolean }>("GET", `/api/users/${userId}`);
}

export async function apiUpdateUser(userId: string, data: { name?: string; onboardingCompleted?: boolean }) {
  return apiRequest<any>("PUT", `/api/users/${userId}`, data);
}

export async function apiDeleteUser(userId: string) {
  return apiRequest<{ success: boolean }>("DELETE", `/api/users/${userId}`);
}

export async function apiGetMealPreference(userId: string) {
  return apiRequest<any>("GET", `/api/meal-preferences/${userId}`);
}

export async function apiUpdateMealPreference(userId: string, data: any) {
  return apiRequest<any>("PUT", `/api/meal-preferences/${userId}`, data);
}

export async function apiGetAdminNote(userId: string) {
  return apiRequest<any>("GET", `/api/admin-notes/${userId}`);
}

export async function apiUpdateAdminNote(userId: string, data: { note: string }) {
  return apiRequest<any>("PUT", `/api/admin-notes/${userId}`, data);
}

export async function apiGetMealPlan(userId: string) {
  return apiRequest<any>("GET", `/api/meal-plans/${userId}`);
}

export async function apiUpdateMealPlan(userId: string, data: { content: string; fileType?: string }) {
  return apiRequest<any>("PUT", `/api/meal-plans/${userId}`, data);
}

export async function apiCreateAvailabilityBlock(data: { date: string; startTime: string; endTime: string; branchId: string }) {
  return apiRequest<any>("POST", "/api/availability", data);
}

export async function apiDeleteAvailabilityBlock(blockId: string) {
  return apiRequest<{ success: boolean }>("DELETE", `/api/availability/${blockId}`);
}

export async function apiGetDashboardStats() {
  return apiRequest<{ clientsCount: number; todayBookings: number; availableSlots: number }>("GET", "/api/dashboard/stats");
}

export async function apiCreateLocation(data: { name: string; address: string }) {
  return apiRequest<any>("POST", "/api/locations", data);
}

export async function apiUpdateLocation(locationId: string, data: { name?: string; address?: string; isActive?: boolean }) {
  return apiRequest<any>("PUT", `/api/locations/${locationId}`, data);
}
