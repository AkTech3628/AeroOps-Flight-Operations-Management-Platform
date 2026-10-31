const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const request = async (path, { token, ...options } = {}) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Something went wrong. Please try again.');
  }
  return result;
};

export const signIn = (email, password) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const signUp = (email, password) =>
  request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const getFlights = (token) => request('/flights', { token });
export const getFlight = (token, id) => request(`/flights/${id}`, { token });
export const createFlight = (token, flight) =>
  request('/flights', {
    token,
    method: 'POST',
    body: JSON.stringify(flight),
  });
export const updateFlight = (token, id, flight) =>
  request(`/flights/${id}`, {
    token,
    method: 'PATCH',
    body: JSON.stringify(flight),
  });
export const deleteFlight = (token, id) =>
  request(`/flights/${id}`, { token, method: 'DELETE' });
export const syncFlights = (token) =>
  request('/flights/sync', { token, method: 'POST' });
