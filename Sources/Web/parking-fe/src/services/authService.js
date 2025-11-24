import apiClient from './api';

export const authService = {
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', {
      username,
      password,
    });
    return response.data;
  },
  
  register: async (registerData) => {
    const response = await apiClient.post('/auth/register', registerData);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  
  saveTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  
  getAccessToken: () => {
    return localStorage.getItem('accessToken');
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
};

