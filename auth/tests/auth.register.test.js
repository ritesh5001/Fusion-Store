const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

describe('POST /api/auth/register', () => {
  it('creates a user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')   
      .send({
        username: 'john_doe',
        email: 'john@example.com',
        password: 'Password123',
        fullName: {                 
          firstName: 'John',
          lastName: 'Doe'
        }
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.username).toBe('john_doe');
  });

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'a' });
    expect(res.statusCode).toBe(400);
  });

  it('prevents duplicate users', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'dup',
        email: 'dup@example.com',
        password: 'Password123',
        firstName: 'Du',
        lastName: 'P'
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'dup',
        email: 'dup@example.com',
        password: 'Password123',
        firstName: 'Du',
        lastName: 'P'
      });
    expect(res.statusCode).toBe(409);
  });
});
