const {
  startBackendServer,
  stopBackendServer,
} = require("../helpers/backend-server");

describe("backend API", () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    const started = await startBackendServer();
    server = started.child;
    baseUrl = started.baseUrl;
  });

  afterAll(async () => {
    await stopBackendServer(server);
  });

  it("returns a product list", async () => {
    const response = await fetch(`${baseUrl}/api/products`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("logs in a seeded user and returns a token", async () => {
    const response = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@eshop.com", password: "Test1234!" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.token).toBeTruthy();
  });

  it("returns the current user profile for a valid token", async () => {
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@eshop.com", password: "Test1234!" }),
    });
    const loginBody = await loginResponse.json();

    const response = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.email).toBe("test@eshop.com");
  });
});