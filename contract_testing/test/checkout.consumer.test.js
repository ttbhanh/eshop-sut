const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const axios = require('axios');
const path = require('path');

const { regex, integer } = MatchersV3;

const provider = new PactV3({
  consumer: 'EshopConsumer',
  provider: 'EShopBackend',
  dir: path.resolve(process.cwd(), 'pacts'),
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  logLevel: process.env.PACT_LOG_LEVEL || 'info',
});

describe('POST /api/checkout', () => {
  it('successfully processes checkout and returns orderId', async () => {
    provider.addInteraction({
      states: [{ description: 'cart has items ready for checkout' }],
      uponReceiving: 'a request to checkout',
      withRequest: {
        method: 'POST',
        path: '/api/checkout',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: {
          total_amount: 200000,
          shipping_address: '123 Le Loi, TP.HCM',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          message: MatchersV3.like('Checkout successful'),
          orderId: integer(101),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      const response = await axios.post(
        `${mockServer.url}/api/checkout`,
        { total_amount: 200000, shipping_address: '123 Le Loi, TP.HCM' },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      );

      expect(response.status).toEqual(200);
      expect(response.data.orderId).toBeDefined();
    });
  });

  it('returns 401 when no token is provided', async () => {
    provider.addInteraction({
      states: [{ description: 'system is running' }],
      uponReceiving: 'a request to checkout without token',
      withRequest: {
        method: 'POST',
        path: '/api/checkout',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          total_amount: 200000,
          shipping_address: '...',
        },
      },
      willRespondWith: {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          error: MatchersV3.like('Unauthorized'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(
          `${mockServer.url}/api/checkout`,
          { total_amount: 200000, shipping_address: '...' },
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        expect(error.response.status).toEqual(401);
        expect(error.response.data.error).toEqual('Unauthorized');
      }
    });
  });

  it('returns 403 when token is invalid', async () => {
    provider.addInteraction({
      states: [{ description: 'system is running' }],
      uponReceiving: 'a request to checkout with invalid token',
      withRequest: {
        method: 'POST',
        path: '/api/checkout',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer BAD_TOKEN',
        },
        body: {
          total_amount: 200000,
          shipping_address: '...',
        },
      },
      willRespondWith: {
        status: 403,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          error: MatchersV3.like('Forbidden'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(
          `${mockServer.url}/api/checkout`,
          { total_amount: 200000, shipping_address: '...' },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer BAD_TOKEN',
            },
          }
        );
      } catch (error) {
        expect(error.response.status).toEqual(403);
        expect(error.response.data.error).toEqual('Forbidden');
      }
    });
  });

  it('handles request missing total_amount', async () => {
    provider.addInteraction({
      states: [{ description: 'cart has items ready for checkout' }],
      uponReceiving: 'a request to checkout missing total_amount',
      withRequest: {
        method: 'POST',
        path: '/api/checkout',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: {
          shipping_address: '123 ABC',
        },
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
        await axios.post(
          `${mockServer.url}/api/checkout`,
          { shipping_address: '123 ABC' },
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

  it('handles request missing shipping_address', async () => {
    provider.addInteraction({
      states: [{ description: 'cart has items ready for checkout' }],
      uponReceiving: 'a request to checkout missing shipping_address',
      withRequest: {
        method: 'POST',
        path: '/api/checkout',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: {
          total_amount: 100000,
        },
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
        await axios.post(
          `${mockServer.url}/api/checkout`,
          { total_amount: 100000 },
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

  it('handles request with empty body', async () => {
    provider.addInteraction({
      states: [{ description: 'cart has items ready for checkout' }],
      uponReceiving: 'a request to checkout with empty body',
      withRequest: {
        method: 'POST',
        path: '/api/checkout',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
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
        await axios.post(
          `${mockServer.url}/api/checkout`,
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

  it('handles request with negative total_amount', async () => {
    provider.addInteraction({
      states: [{ description: 'cart has items ready for checkout' }],
      uponReceiving: 'a request to checkout with negative total_amount',
      withRequest: {
        method: 'POST',
        path: '/api/checkout',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: {
          total_amount: -50000,
          shipping_address: '...',
        },
      },
      willRespondWith: {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          error: MatchersV3.string('Invalid total_amount'),
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      try {
        await axios.post(
          `${mockServer.url}/api/checkout`,
          { total_amount: -50000, shipping_address: '...' },
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
