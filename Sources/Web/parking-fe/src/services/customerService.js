import api from "./api";

const customerService = {
  findAll: async () => {
    try {
      // Backend controller uses search endpoint. If query is empty, it returns all.
      const response = await api.get("/customers/search");
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  search: async (query) => {
    try {
      const response = await api.get("/customers/search", {
        params: { query },
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (customerId, data) => {
    try {
      const response = await api.put(`/customers/${customerId}`, data);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },
  
  getById: async (customerId) => {
      try {
        const response = await api.get(`/customers/${customerId}`);
        return response.data.data;
      } catch (error) {
        throw error;
      }
  }
};

export { customerService };
