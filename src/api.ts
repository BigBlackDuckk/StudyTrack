// Backend opcional do StudyTrack. Em desenvolvimento, defina EXPO_PUBLIC_API_URL.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333';
export async function api<T>(path:string, options:RequestInit={}) : Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {headers:{'Content-Type':'application/json', ...(options.headers||{})}, ...options});
  if(!response.ok) throw new Error(await response.text());
  return response.json();
}
export { API_URL };
