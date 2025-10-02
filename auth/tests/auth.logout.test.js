const request = require('supertest');
const app = require('../src/app');

describe('GET /api/auth/logout', () => {
  let authCookie;

  beforeEach(async () => {
    // Create and login a user to get auth cookie
    const user = {
      username: 'logout_test_user',
      email: 'logout_test@example.com',
      password: 'Password123',
      fullName: { firstName: 'Logout', lastName: 'Test' }
    };

    // Register user
    await request(app)
      .post('/api/auth/register')
      .send(user)
      .expect(201);

    // Login user to get auth cookie
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);

    // Extract the auth cookie
    authCookie = loginRes.headers['set-cookie'].find(cookie => 
      cookie.startsWith('token=')
    );
  });

  it('should logout successfully and clear token cookie', async () => {
    const res = await request(app)
      .get('/api/auth/logout')
      .set('Cookie', authCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');

    // Check that the token cookie is cleared
    expect(res.headers['set-cookie']).toBeDefined();
    const cookies = res.headers['set-cookie'].join(';');
    expect(cookies).toMatch(/token=;/); // Cookie should be cleared (empty value)
  });

  it('should logout successfully even without authentication cookie', async () => {
    const res = await request(app)
      .get('/api/auth/logout');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');

    // Check that the token cookie is cleared
    expect(res.headers['set-cookie']).toBeDefined();
    const cookies = res.headers['set-cookie'].join(';');
    expect(cookies).toMatch(/token=;/); // Cookie should be cleared (empty value)
  });

  it('should logout successfully with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/logout')
      .set('Cookie', 'token=invalid_token_here');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');

    // Check that the token cookie is cleared
    expect(res.headers['set-cookie']).toBeDefined();
    const cookies = res.headers['set-cookie'].join(';');
    expect(cookies).toMatch(/token=;/); // Cookie should be cleared (empty value)
  });

  it('should verify user cannot access protected routes after logout', async () => {
    // First logout
    await request(app)
      .get('/api/auth/logout')
      .set('Cookie', authCookie)
      .expect(200);

    // Try to access protected route (/me) with the same cookie
    const protectedRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);

    // Should be unauthorized since the cookie is cleared
    expect(protectedRes.statusCode).toBe(401);
  });

  it('should handle multiple logout requests gracefully', async () => {
    // First logout
    const firstLogout = await request(app)
      .get('/api/auth/logout')
      .set('Cookie', authCookie);

    expect(firstLogout.statusCode).toBe(200);

    // Second logout (should still work)
    const secondLogout = await request(app)
      .get('/api/auth/logout');

    expect(secondLogout.statusCode).toBe(200);
    expect(secondLogout.body).toHaveProperty('message', 'Logged out successfully');
  });

  it('should clear cookie with correct attributes', async () => {
    const res = await request(app)
      .get('/api/auth/logout')
      .set('Cookie', authCookie);

    expect(res.statusCode).toBe(200);

    // Check cookie clearing attributes
    const setCookieHeader = res.headers['set-cookie'].find(cookie => 
      cookie.includes('token=')
    );

    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toMatch(/HttpOnly/i); // Should have HttpOnly flag
    expect(setCookieHeader).toMatch(/token=;/); // Should have empty value
  });
});