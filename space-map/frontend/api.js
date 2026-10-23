const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const api = {
  get: (url) => fetch(BASE + url).then(r => r.json()),
  post: (url, body) => fetch(BASE + url, { method: 'POST', body: JSON.stringify(body), headers: {'Content-Type': 'application/json'} }).then(r => r.json())
};