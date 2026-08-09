const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const axios = require('axios');
const path = require('path');

const { integer, regex } = MatchersV3;

const provider = new PactV3({
  consumer: 'EshopConsumer',
  provider: 'EShopBackend',
  dir: path.resolve(process.cwd(), 'pacts'),
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  logLevel: process.env.PACT_LOG_LEVEL || 'info',
});

describe('POST /api/cart', () => {
  it('adds an item to the cart and returns 200 with cart details', async () => {
    provider.addInteraction({
      states: [{ description: 'a valid auth token exists, user cart is empty, and product with ID 1 exists' }],
      uponReceiving: 'a request to add item to cart',
      withRequest: {
        method: 'POST',
        path: '/api/cart',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: {
          id: 1,
          name: "iPhone 15 Pro Max",
          price: 30000000,
          quantity: 2,
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: {
          message: MatchersV3.like('Added to cart'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      const response = await axios.post(
        `${mockServer.url}/api/cart`,
        { id: 1, name: "iPhone 15 Pro Max", price: 30000000, quantity: 2 },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      );

      expect(response.status).toEqual(200);
      expect(response.data.message).toEqual("Added to cart");
    });
  });

  it('returns 401 Unauthorized when no token is provided', async () => {
    provider.addInteraction({
      states: [{ description: 'system is running' }],
      uponReceiving: 'a request to add item to cart without auth token',
      withRequest: {
        method: 'POST',
        path: '/api/cart',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          id: 1,
          name: "Test",
          price: 100,
          quantity: 1,
        },
      },
      willRespondWith: {
        status: 401,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: {
          error: MatchersV3.like('Unauthorized'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(
          `${mockServer.url}/api/cart`,
          { id: 1, name: "Test", price: 100, quantity: 1 },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (error) {
        expect(error.response.status).toEqual(401);
        expect(error.response.data.error).toEqual("Unauthorized");
      }
    });
  });

  it('returns 403 Forbidden when token is invalid', async () => {
    provider.addInteraction({
      states: [{ description: 'system is running' }],
      uponReceiving: 'a request to add item to cart with invalid token',
      withRequest: {
        method: 'POST',
        path: '/api/cart',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer INVALID_TOKEN_123',
        },
        body: {
          id: 1,
          name: "Test",
          price: 100,
          quantity: 1,
        },
      },
      willRespondWith: {
        status: 403,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: {
          error: MatchersV3.like('Forbidden'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(
          `${mockServer.url}/api/cart`,
          { id: 1, name: "Test", price: 100, quantity: 1 },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer INVALID_TOKEN_123',
            },
          }
        );
      } catch (error) {
        expect(error.response.status).toEqual(403);
        expect(error.response.data.error).toEqual("Forbidden");
      }
    });
  });

  it('returns 400 when body is empty (Bug)', async () => {
    provider.addInteraction({
      states: [{ description: 'a valid auth token exists, user cart is empty, and product with ID 1 exists' }],
      uponReceiving: 'a request to add item to cart with empty body',
      withRequest: {
        method: 'POST',
        path: '/api/cart',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: {},
      },
      willRespondWith: {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: {
          error: MatchersV3.string('Missing required fields'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(
          `${mockServer.url}/api/cart`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token',
            },
          }
        );
      } catch (error) {
        expect(error.response.status).toEqual(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  it('returns 400 when missing required fields (Bug)', async () => {
    provider.addInteraction({
      states: [{ description: 'a valid auth token exists, user cart is empty, and product with ID 1 exists' }],
      uponReceiving: 'a request to add item to cart with missing fields',
      withRequest: {
        method: 'POST',
        path: '/api/cart',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: {
          name: "Test",
        },
      },
      willRespondWith: {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: {
          error: MatchersV3.string('Missing required fields'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(
          `${mockServer.url}/api/cart`,
          { name: "Test" },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token',
            },
          }
        );
      } catch (error) {
        expect(error.response.status).toEqual(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  it('returns 400 when quantity is negative or zero (Bug)', async () => {
    provider.addInteraction({
      states: [{ description: 'a valid auth token exists, user cart is empty, and product with ID 1 exists' }],
      uponReceiving: 'a request to add item to cart with negative quantity',
      withRequest: {
        method: 'POST',
        path: '/api/cart',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: {
          id: 1,
          name: "Test",
          price: 100,
          quantity: -1,
        },
      },
      willRespondWith: {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: {
          error: MatchersV3.string('Invalid quantity'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(
          `${mockServer.url}/api/cart`,
          { id: 1, name: "Test", price: 100, quantity: -1 },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token',
            },
          }
        );
      } catch (error) {
        expect(error.response.status).toEqual(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });
});
