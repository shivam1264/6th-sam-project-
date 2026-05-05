import axios from 'axios';

const api = axios.create({
  baseURL: 'https://sixth-sam-project.onrender.com',
});

export default api;
