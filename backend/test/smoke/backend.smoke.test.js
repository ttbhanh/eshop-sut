const {
  startBackendServer,
  stopBackendServer,
} = require("../helpers/backend-server");

describe("backend smoke", () => {
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

  it("serves products and categories over HTTP", async () => {
    const [productsResponse, categoriesResponse] = await Promise.all([
      fetch(`${baseUrl}/api/products`),
      fetch(`${baseUrl}/api/categories`),
    ]);

    expect(productsResponse.ok).toBe(true);
    expect(categoriesResponse.ok).toBe(true);
  });
});