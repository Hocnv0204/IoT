import apiClient from "./api";

export const vehicleService = {
  search: async (customerId, plate) => {
    const params = {};
    if (customerId != null) params.customerId = customerId;
    if (plate != null) params.plate = plate;
    const response = await apiClient.get("/vehicles/search", { params });
    return response.data.data;
  },

  create: async (payload) => {
    // POST to singular vehicle endpoint
    const response = await apiClient.post("/vehicle", payload);
    return response.data.data;
  },

  register: async (payload) => {
    // In case you want to use register endpoint that also creates card
    const response = await apiClient.post("/vehicle/register", payload);
    return response.data.data;
  },
};

export default vehicleService;
