const request = require('supertest');
const app = require('../src/app');

describe('GET /api/auth/me', () => {
  it('returns current user with valid token cookie', async () => {
    const agent = request.agent(app);
    const user = {
      username: 'me_user',
      email: 'me_user@example.com',
      password: 'Password123',
      fullName: { firstName: 'Me', lastName: 'User' }
    };

    // Register and login to obtain auth cookie on the agent
    await agent.post('/api/auth/register').send(user).expect(201);
    await agent.post('/api/auth/login').send({ email: user.email, password: user.password }).expect(200);

    const res = await agent.get('/api/auth/me');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', user.email);
    expect(res.body.user).toHaveProperty('username', user.username);
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'token=invalid.jwt.token; Path=/; HttpOnly');

    expect(res.statusCode).toBe(401);
  });
});
 