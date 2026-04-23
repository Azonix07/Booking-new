const BASE = 'http://localhost:3001/api/v1';

async function test() {
  // Step 1: Register a new test user
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Admin',
      email: `test${Date.now()}@test.com`,
      password: 'TestPass123!',
      phone: `9${Date.now().toString().slice(-9)}`,
      role: 'client_admin',
      businessName: `TestBiz${Date.now()}`,
    }),
  });
  const regJson = await regRes.json();
  console.log('REGISTER status:', regRes.status);

  if (!regRes.ok) {
    console.log('REGISTER error:', regJson.message);
    return;
  }

  const token = regJson.data?.accessToken || regJson.accessToken;
  if (!token) {
    console.log('No token:', JSON.stringify(regJson).slice(0, 200));
    return;
  }
  console.log('Got token:', token.slice(0, 30) + '...');

  // Step 2: GET wizard progress
  const getRes = await fetch(`${BASE}/setup-wizard`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  console.log('GET wizard status:', getRes.status);
  const getJson = await getRes.json();
  console.log('GET wizard body:', JSON.stringify(getJson).slice(0, 200));

  // Step 3: PUT business-type
  const putRes = await fetch(`${BASE}/setup-wizard/step/business-type`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ category: 'gaming-lounge' }),
  });
  const putJson = await putRes.json();
  console.log('PUT status:', putRes.status);
  console.log('PUT body:', JSON.stringify(putJson));
}

test().catch(e => console.error('Error:', e.message));
