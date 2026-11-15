import { auth } from './firebase.js';

export async function api(path, { authenticated = false, ...options } = {}) {
  const headers = { ...options.headers };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (authenticated) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error('Please sign in to continue.');
    headers.Authorization = `Bearer ${token}`;
  }
  let response;
  try { response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api${path}`, { ...options, headers }); }
  catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Unable to reach the server. Please check your connection and try again.');
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const details = data?.details ? Object.entries(data.details).map(([key, values]) => `${key}: ${values.join(', ')}`).join(' · ') : '';
    const error = new Error(details || data?.error || 'The request could not be completed. Please try again.');
    error.status = response.status;
    throw error;
  }
  if (data === null) throw new Error('The server returned an unexpected response.');
  return data;
}

export const formatDate = date => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unpublished';
