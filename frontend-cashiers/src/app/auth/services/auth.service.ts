import axios from 'axios';

// ambil dari env
const API_URL = process.env.REACT_APP_API_URL;

export const authService = {
  login: async (data: any) => {
    const response = await axios.post(`${API_URL}/auth/login`, data);
    return response.data;
  },

  register: async (data: any) => {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    return response.data;
  }
};