const request = require('supertest');
const app = require('../src/app');

// NOTE: These tests assume the following endpoints exist and behave as described:
// - GET    /api/auth/user/me/addresses               -> returns { addresses: Address[] }
// - POST   /api/auth/user/me/addresses               -> body: address payload; returns { message, address }
// - DELETE /api/auth/user/me/addresses/:addressId    -> returns { message }
// Address shape assumption includes fields: street, city, state, country, pincode, isDefault.
// We also assume only one address can be default at a time. Passing { isDefault: true } when adding
// makes the new one default and removes default from the previous.

describe('Addresses API for current user', () => {
  const registerAndLogin = async (agent, overrides = {}) => {
    const user = {
      username: `user_${Date.now()}`,
      email: `user_${Date.now()}@example.com`,
      password: 'Password123',
      fullName: { firstName: 'Test', lastName: 'User' },
      ...overrides,
    };

    await agent.post('/api/auth/register').send(user).expect(201);
    await agent
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);
    return user;
  };

  const validAddress = (overrides = {}) => ({
    street: '221B Baker Street',
    city: 'London',
    state: 'London',
    country: 'UK',
    pincode: '560001', // 6 digits
    ...overrides,
  });

  describe('POST /api/auth/user/me/addresses', () => {
    it('adds an address successfully and sets default for the first address', async () => {
      const agent = request.agent(app);
      await registerAndLogin(agent);

      const res = await agent
        .post('/api/auth/user/me/addresses')
        .send(validAddress())
        .expect(201);

      expect(res.body).toHaveProperty('address');
      expect(res.body.address).toHaveProperty('_id');
      expect(res.body.address).toHaveProperty('street', '221B Baker Street');
      expect(res.body.address).toHaveProperty('isDefault', true);
    });

    it('validates pincode (must be 6 digits)', async () => {
      const agent = request.agent(app);
      await registerAndLogin(agent);

      // Invalid pincode
      const badPin = await agent
        .post('/api/auth/user/me/addresses')
        .send(validAddress({ pincode: '12345' })) // 5 digits
        .expect(400);
      expect(badPin.body).toBeDefined();

    });

    it('marks a newly added address as default when isDefault=true and unsets previous default', async () => {
      const agent = request.agent(app);
      await registerAndLogin(agent);

      const first = await agent
        .post('/api/auth/user/me/addresses')
        .send(validAddress())
        .expect(201);
      expect(first.body.address.isDefault).toBe(true);

      const second = await agent
        .post('/api/auth/user/me/addresses')
        .send(validAddress({ street: '742 Evergreen Terrace', isDefault: true }))
        .expect(201);
      expect(second.body.address.isDefault).toBe(true);

      const list = await agent.get('/api/auth/user/me/addresses').expect(200);
      const defaults = (list.body.addresses || []).filter(a => a.isDefault);
      expect(defaults.length).toBe(1);
      expect(defaults[0].street).toBe('742 Evergreen Terrace');
    });

    it('requires authentication', async () => {
      await request(app)
        .post('/api/auth/user/me/addresses')
        .send(validAddress())
        .expect(401);
    });
  });

  describe('GET /api/auth/user/me/addresses', () => {
    it('lists saved addresses for the current user with default marked', async () => {
      const agent = request.agent(app);
      await registerAndLogin(agent);

      // Add two addresses
      await agent.post('/api/auth/user/me/addresses').send(validAddress()).expect(201);
      await agent
        .post('/api/auth/user/me/addresses')
        .send(validAddress({ street: '10 Downing Street', isDefault: true }))
        .expect(201);

      const res = await agent.get('/api/auth/user/me/addresses').expect(200);
      expect(res.body).toHaveProperty('addresses');
      expect(Array.isArray(res.body.addresses)).toBe(true);
      expect(res.body.addresses.length).toBeGreaterThanOrEqual(2);

      const defaults = res.body.addresses.filter(a => a.isDefault);
      expect(defaults.length).toBe(1);
      expect(defaults[0]).toHaveProperty('street', '10 Downing Street');
    });

    it('requires authentication', async () => {
      await request(app).get('/api/auth/user/me/addresses').expect(401);
    });
  });

  describe('DELETE /api/auth/user/me/addresses/:addressId', () => {
    it('removes an existing address', async () => {
      const agent = request.agent(app);
      await registerAndLogin(agent);

      // Create two addresses
      const a1 = await agent.post('/api/auth/user/me/addresses').send(validAddress()).expect(201);
      const a2 = await agent
        .post('/api/auth/user/me/addresses')
        .send(validAddress({ street: 'Sherlock HQ' }))
        .expect(201);

      const toDeleteId = a1.body.address._id;

      await agent.delete(`/api/auth/user/me/addresses/${toDeleteId}`).expect(200);

      const res = await agent.get('/api/auth/user/me/addresses').expect(200);
      const ids = res.body.addresses.map(a => a._id);
      expect(ids).not.toContain(toDeleteId);
      expect(ids).toContain(a2.body.address._id);
    });

    it('returns 404 when address does not exist', async () => {
      const agent = request.agent(app);
      await registerAndLogin(agent);

      const nonExistentId = '64b7f54e0d4f1e23c8a9b012'; // valid-like ObjectId
      await agent
        .delete(`/api/auth/user/me/addresses/${nonExistentId}`)
        .expect(404);
    });

    it('requires authentication', async () => {
      await request(app)
        .delete('/api/auth/user/me/addresses/64b7f54e0d4f1e23c8a9b012')
        .expect(401);
    });
  });
});
