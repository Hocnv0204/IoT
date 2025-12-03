import apiClient from "./api";

export const parkingSessionService = {
  getOverview: async () => {
    const response = await apiClient.get("/parking-session/overview");
    return response.data.data;
  },

  getLogs: async ({
    pageNumber = 0,
    pageSize = 10,
    sortBy,
    orderBy,
    status,
    fromDate,
    toDate,
    licensePlate,
  } = {}) => {
    const params = {
      pageNumber,
      pageSize,
    };

    if (sortBy) params.sortBy = sortBy;
    if (orderBy) params.orderBy = orderBy;
    if (status) params.status = status;
    if (licensePlate) params.licensePlate = licensePlate;
    if (fromDate) params.fromDate = fromDate.toISOString();
    if (toDate) params.toDate = toDate.toISOString();

    const response = await apiClient.get("/parking-session/get-logs", {
      params,
    });
    return response.data.data;
  },
};

export default parkingSessionService;



