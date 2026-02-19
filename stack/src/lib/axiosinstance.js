import axios from "axios";

const axiosInstance = axios.create({
  baseURL: typeof window !== "undefined" ? window.location.origin.includes('localhost') ? 'http://localhost:5000' : process.env.NEXT_PUBLIC_API_URL : process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
axiosInstance.interceptors.request.use((req) => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    if (user) {
      const token = JSON.parse(user).token;
      if (token) {
        req.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return req;
});
export default axiosInstance;
