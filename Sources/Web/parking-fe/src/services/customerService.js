import apiClient from "./api";

export const customerService = {
  search: async (query) => {
    const response = await apiClient.get("/customers/search", {
      params: { query },
    });
    return response.data.data; // ApiResponse wrapper
  },

  create: async (payload) => {
    const response = await apiClient.post("/customers", payload);
    return response.data.data;
  },
};

export default customerService;
