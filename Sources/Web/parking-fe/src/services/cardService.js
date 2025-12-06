import apiClient from "./api";

export const cardService = {
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
};

export default cardService;
