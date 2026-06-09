const API_URL = 'https://easydeal.onrender.com/api/auth';
export async function registerUser(credentials) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  await checkResponseStatus(response);
  const data = await response.json();
  return data.data; // The backend sends { success, message, data: { token, user } }
}

export async function loginUser(credentials) {
  // TODO: Replace the URL with the actual backend endpoint for authentication '/api/auth/login'
  let payload = {
    emailOrUsername: credentials.email,
    password: credentials.password,
  };
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await checkResponseStatus(response);
  const data = await response.json();
  return data.data;
}

async function checkResponseStatus(response) {
  if (response.ok) {
    return;
  }

  let message = '';
  try {
    const errorBody = await response.json();
    if (errorBody?.message) {
      message = errorBody.message;
    }
  } catch (error) {
    // ignore parse errors and use the fallback message
  }

  if (message !== '') {
    throw new Error(message);
  }
  if (response.status === 401) {
    throw new Error('Invalid email or password.');
  }
  if (response.status === 500) {
    throw new Error('Server is down. Please try again later.');
  }
  // Fallback for other errors (404, 403, etc.)
  throw new Error('Something went wrong. Error code: ' + response.status);
}
