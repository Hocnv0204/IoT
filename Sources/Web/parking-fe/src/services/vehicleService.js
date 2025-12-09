import apiClient from "./api";

export const vehicleService = {
  search: async (customerId, plate) => {
    const params = {};
    if (customerId != null) params.customerId = customerId;
    if (plate != null) params.plate = plate;
    const response = await apiClient.get("/vehicle/search", { params });
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

  findAll: async (
    page = 0,
    size = 10,
    sortBy = "id",
    orderBy = "asc"
  ) => {
    const params = { page, size, sortBy, orderBy };
    const response = await apiClient.get("/vehicle/find-all", { params });
    return response.data.data;
  },

  getById: async (vehicleId) => {
    const response = await apiClient.get(`/vehicle/${vehicleId}`);
    return response.data.data;
  },

  update: async (vehicleId, payload) => {
    const response = await apiClient.put(`/vehicle/${vehicleId}`, payload);
    return response.data.data;
  },
};

export default vehicleService;
