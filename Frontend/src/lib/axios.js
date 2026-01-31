import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://gossipy-1.onrender.com",
  withCredentials: true,
});

// import.meta.env.MODE === "development" ? "http://localhost:8000/api" : "/api",