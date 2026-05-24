export async function registerUser(credentials) {
  // const response = await fetch('https://easydeal.onrender.com/api/auth/register', {
  const response = await fetch("http://localhost:3000/api/auth/register", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  await checkResponseStatus(response);
  const data = await response.json();
  return data.data; // The backend sends { success, message, data: { token, user } }
}

export async function loginUser(credentials) {
  // TODO: Replace the URL with the actual backend endpoint for authentication '/api/auth/login'
  const response = await fetch('login.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  await checkResponseStatus(response);
  const data = await response.json();
  return data;
}

async function checkResponseStatus(response) {
  if (response.ok) {
    return;
  }

  let message = "";
  try {
    const errorBody = await response.json();
    if (errorBody?.message) {
      message = errorBody.message;
    }
  } catch (error) {
    // ignore parse errors and use the fallback message
  }

  if (message !== "") {
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

