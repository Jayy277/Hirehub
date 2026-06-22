import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically attach authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const api = {
  // Auth calls
  auth: {
    login: (email, password) => apiClient.post("/auth/login", { email, password }),
    register: (name, email, password, role) =>
      apiClient.post("/auth/register", { name, email, password, role }),
    me: () => apiClient.get("/auth/me"),
  },

  // Student calls
  student: {
    updateProfile: (education, skills) => apiClient.put("/student/profile", { education, skills }),
    uploadResume: (formData) =>
      apiClient.post("/student/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    uploadPhoto: (formData) =>
      apiClient.post("/student/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    deletePhoto: () => apiClient.delete("/student/photo"),
    getApplications: () => apiClient.get("/student/applications"),
  },

  // Company calls
  company: {
    getInternships: () => apiClient.get("/company/internships"),
    getApplicants: (internshipId) => apiClient.get(`/company/applications/${internshipId}`),
    updateApplicantStatus: (applicationId, status) =>
      apiClient.put(`/company/applications/${applicationId}`, { status }),
  },

  // Internship calls
  internship: {
    list: (keyword = "", skills = []) => {
      const params = {};
      if (keyword) params.keyword = keyword;
      if (skills.length > 0) params.skills = skills.join(",");
      return apiClient.get("/internships", { params });
    },
    get: (id) => apiClient.get(`/internships/${id}`),
    create: (data) => apiClient.post("/internships", data),
    apply: (id) => apiClient.post(`/internships/${id}/apply`),
  },

  // Admin calls
  admin: {
    getStats: () => apiClient.get("/admin/stats"),
    getStudents: () => apiClient.get("/admin/students"),
    toggleStudentStatus: (id, isActive) =>
      apiClient.put(`/admin/students/${id}/status`, { is_active: isActive }),
    deleteStudent: (id) => apiClient.delete(`/admin/students/${id}`),
    
    getCompanies: () => apiClient.get("/admin/companies"),
    toggleCompanyStatus: (id, isActive) =>
      apiClient.put(`/admin/companies/${id}/status`, { is_active: isActive }),
    deleteCompany: (id) => apiClient.delete(`/admin/companies/${id}`),
    
    getInternships: () => apiClient.get("/admin/internships"),
    modifyInternship: (id, data) => apiClient.put(`/admin/internships/${id}`, data),
    deleteInternship: (id) => apiClient.delete(`/admin/internships/${id}`),
  },
};

export default api;
