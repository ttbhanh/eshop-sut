const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const axios = require('axios');
const path = require('path');

const { regex } = MatchersV3;

const provider = new PactV3({
  consumer: 'EshopConsumer',
  provider: 'EShopBackend',
  dir: path.resolve(process.cwd(), 'pacts'),
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  logLevel: process.env.PACT_LOG_LEVEL || 'info',
});

describe('POST /api/login', () => {
  it('returns 200 and a token when credentials are valid', async () => {
    provider.addInteraction({
      states: [{ description: 'User exists with valid credentials' }],
      uponReceiving: 'a request to login with valid credentials',
      withRequest: {
        method: 'POST',
        path: '/api/login',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'test@eshop.com', password: 'Test1234!' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          message: MatchersV3.like('Login successful'),
          token: MatchersV3.string('mocked-jwt-token'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      const response = await axios.post(`${mockServer.url}/api/login`, {
        email: 'test@eshop.com',
        password: 'Test1234!',
      });
      expect(response.status).toEqual(200);
      expect(response.data.token).toBeDefined();
    });
  });

  it('returns 401 when password is wrong', async () => {
    provider.addInteraction({
      states: [{ description: 'User exists but password is wrong' }],
      uponReceiving: 'a request to login with wrong password',
      withRequest: {
        method: 'POST',
        path: '/api/login',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'test@eshop.com', password: 'WrongPass!' },
      },
      willRespondWith: {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          error: MatchersV3.like('Invalid email or password'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(`${mockServer.url}/api/login`, {
          email: 'test@eshop.com',
          password: 'WrongPass!',
        });
      } catch (error) {
        expect(error.response.status).toEqual(401);
        expect(error.response.data.error).toBeDefined();
      }
    });
  });

  it('returns 401 when email does not exist', async () => {
    provider.addInteraction({
      states: [{ description: 'Email does not exist' }],
      uponReceiving: 'a request to login with non-existent email',
      withRequest: {
        method: 'POST',
        path: '/api/login',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'noexist@eshop.com', password: 'any' },
      },
      willRespondWith: {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          error: MatchersV3.like('Invalid email or password'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(`${mockServer.url}/api/login`, {
          email: 'noexist@eshop.com',
          password: 'any',
        });
      } catch (error) {
        expect(error.response.status).toEqual(401);
      }
    });
  });

  it('returns 400 when email field is missing', async () => {
    provider.addInteraction({
      states: [{ description: 'system is running' }],
      uponReceiving: 'a request to login with missing email',
      withRequest: {
        method: 'POST',
        path: '/api/login',
        headers: { 'Content-Type': 'application/json' },
        body: { password: 'Test1234!' },
      },
      willRespondWith: {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          error: MatchersV3.string('Missing required fields'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(`${mockServer.url}/api/login`, {
          password: 'Test1234!',
        });
      } catch (error) {
        expect(error.response.status).toEqual(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  it('returns 400 when password field is missing', async () => {
    provider.addInteraction({
      states: [{ description: 'system is running' }],
      uponReceiving: 'a request to login with missing password',
      withRequest: {
        method: 'POST',
        path: '/api/login',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'test@eshop.com' },
      },
      willRespondWith: {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          error: MatchersV3.string('Missing required fields'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(`${mockServer.url}/api/login`, {
          email: 'test@eshop.com',
        });
      } catch (error) {
        expect(error.response.status).toEqual(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  it('returns 400 when body is empty', async () => {
    provider.addInteraction({
      states: [{ description: 'system is running' }],
      uponReceiving: 'a request to login with empty body',
      withRequest: {
        method: 'POST',
        path: '/api/login',
        headers: { 'Content-Type': 'application/json' },
        body: {},
      },
      willRespondWith: {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          error: MatchersV3.string('Missing required fields'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(`${mockServer.url}/api/login`, {});
      } catch (error) {
        expect(error.response.status).toEqual(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  it('returns 403 when account is locked', async () => {
    provider.addInteraction({
      states: [{ description: 'Account is locked' }],
      uponReceiving: 'a request to login to a locked account',
      withRequest: {
        method: 'POST',
        path: '/api/login',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'locked@eshop.com', password: 'Test1234!' },
      },
      willRespondWith: {
        status: 403,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          error: MatchersV3.string('Tài khoản đã bị khóa. Vui lòng thử lại sau.'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(`${mockServer.url}/api/login`, {
          email: 'locked@eshop.com',
          password: 'Test1234!',
        });
      } catch (error) {
        expect(error.response.status).toEqual(403);
        expect(error.response.data.error).toContain('bị khóa');
      }
    });
  });
});
