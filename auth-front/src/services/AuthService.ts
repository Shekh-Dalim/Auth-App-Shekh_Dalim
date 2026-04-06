import type RegisterData from "@/models/RegisterData";
import apiClient from "@/config/apiClient";
import type LoginData from "@/models/LoginData";
import type LoginResponseData from "@/models/LoginResponseData";
import type User from "@/models/User";

// Register user
export const registerUser = async (signupData: RegisterData) => {
  const response = await apiClient.post("/auth/register", signupData);
  return response.data;
};

// Login user
export const loginUser = async (loginData: LoginData) => {
  const response = await apiClient.post<LoginResponseData>(
    "/auth/login",
    loginData
  );
  return response.data;
};

// Logout user
export const logoutUser = async () => {
  const response = await apiClient.post("/auth/logout");
  return response.data;
};

// Get current logged-in user
export const getCurrentUser = async (emailId: string | undefined) => {
  const response = await apiClient.get<User>(`/users/email/${emailId}`);
  return response.data;
};

// Refresh token
export const refreshToken = async () => {
  const response = await apiClient.post<LoginResponseData>("/auth/refresh");
  return response.data;
};