import useAuth from "@/auth/store";
import { refreshToken } from "@/services/AuthService";
import axios from "axios";
import toast from "react-hot-toast";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8083/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

// Before every request
apiClient.interceptors.request.use((config) => {
  const accessToken = useAuth.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let isRefreshing = false;
let pending: Array<(newToken: string) => void> = [];

function queueRequest(cb: (newToken: string) => void) {
  pending.push(cb);
}

function resolveQueue(newToken: string) {
  pending.forEach((cb) => cb(newToken));
  pending = [];
}

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (!error.response) {
      toast.error("Network error");
      return Promise.reject(error);
    }

    const is401 = error.response.status === 401;

    if (!is401 || original._retry) {
      toast.error(error.response?.data?.message || "An error occurred");
      console.error("API Error:", error.response?.data);
      console.error("Full error:", error);
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queueRequest((newToken: string) => {
          if (!newToken || newToken === "null") {
            reject(error);
            return;
          }

          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(apiClient(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const loginResponse = await refreshToken();
      const newToken = loginResponse.accessToken;

      if (!newToken) {
        throw new Error("No access token received");
      }

      useAuth.getState().changeLocalLoginData(
        loginResponse.accessToken,
        loginResponse.user,
        true
      );

      resolveQueue(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;

      return apiClient(original);
    } catch (refreshError) {
      resolveQueue("null");
      useAuth.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;