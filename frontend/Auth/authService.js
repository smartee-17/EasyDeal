export async function loginUser(credentials) {
  // TODO: Replace the URL with the actual backend endpoint for authentication '/api/auth/login'
  const response = await fetch('login.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  // If the response is not 200-299 range
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid email or password.');
    } 
    if (response.status === 500) {
      throw new Error('Server is down. Please try again later.');
    }
    // Fallback for other errors (404, 403, etc.)
    throw new Error('Something went wrong. Error code: ' + response.status);
  }

  const data = await response.json();
  return data
}
