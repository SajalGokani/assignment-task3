import axios from 'axios';

// Fallback to local network IP or localhost
const LOCAL_IP = '10.0.2.2'; 

export const api = axios.create({
    baseURL: `http://${LOCAL_IP}:3333`,
    timeout: 3000, // Quick timeout so the app doesn't hang
});

export const getEvents = () => api.get('/events');
export const createEvent = (eventData: any) => api.post('/events', eventData);