const request = require('supertest');
const app = require('../src/app');

describe('POST /api/auth/login', () => {
  it('logs in successfully and sets token cookie', async () => {
    // First register a user to log in with
    const user = {
      username: 'login_user',
      email: 'login@example.com',
      password: 'Password123',
      fullName: { firstName: 'Log', lastName: 'In' }
    };

    await request(app)
      .post('/api/auth/register')
      .send(user)
      .expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });

    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    const cookies = res.headers['set-cookie'].join(';');
    expect(cookies).toMatch(/token=/i);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', user.email);
    expect(res.body.user).toHaveProperty('username', user.username);
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missingpass@example.com' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects invalid credentials', async () => {
    const user = {
      username: 'login_user_bad_pw',
      email: 'login_bad_pw@example.com',
      password: 'Password123',
      fullName: { firstName: 'Bad', lastName: 'Pw' }
    };

    await request(app)
      .post('/api/auth/register')
      .send(user)
      .expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPassword123' });

    expect(res.statusCode).toBe(401);
  });
});
