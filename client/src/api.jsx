import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
});


api.interceptors.response.use(
  (response) => response, // success pass through
  (error) => {
    if (error.response?.status === 401) {
      // clear storage and go to login
      localStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;