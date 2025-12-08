import apiClient from "./api";

export const cardService = {
  list: async ({ status, type, page = 0, size = 10, sortBy, orderBy } = {}) => {
    const params = {
      page,
      size,
    };

    if (status) params.status = status;
    if (type) params.type = type;
    if (sortBy) params.sortBy = sortBy;
    if (orderBy) params.orderBy = orderBy;

    const response = await apiClient.get("/cards", { params });
    return response.data.data;
  },

  assign: async ({ vehicleId, cardCode, monthsDuration }) => {
    const response = await apiClient.post("/cards/assign", {
      vehicleId,
      cardCode,
      monthsDuration,
    });
    return response.data.data;
  },

  registerDaily: async (cardCode) => {
    const response = await apiClient.post("/cards/register-daily", { rfid: cardCode });
    return response.data.data;
  },

  updateStatus: async (cardId, status) => {
    const response = await apiClient.patch(`/cards/${cardId}/status`, { status });
    return response.data.data;
  }
};

export default cardService;
