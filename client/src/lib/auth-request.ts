export async function authenticatedRequest(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (response.status === 401 || response.status === 403) {
    // Token expired or invalid, clear it
    localStorage.removeItem('token');
    throw new Error('Authentication required');
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }
  
  return response;
}