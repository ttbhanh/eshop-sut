const { parseBearerToken } = require("../../auth");

describe("parseBearerToken", () => {
  it("returns the token from a valid Bearer header", () => {
    expect(parseBearerToken("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("returns null for missing or malformed headers", () => {
    expect(parseBearerToken()).toBeNull();
    expect(parseBearerToken("Basic abc")).toBeNull();
    expect(parseBearerToken("Bearer")).toBeNull();
    expect(parseBearerToken("Bearer token extra")).toBeNull();
  });
});