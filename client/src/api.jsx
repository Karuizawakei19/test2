

import axios from 'axios';

//  api.get('/listings') calls http://localhost:3001/listings
const api = axios.create({
  baseURL: 'http://localhost:3001',
});

export default api;