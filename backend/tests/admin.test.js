import { describe, it, expect, vi } from "vitest";
import request from "supertest";

process.env.ADMIN_PASSWORD = "test-pass-123";

vi.mock('mongoose', () => {
  const m = {
    Schema: class { constructor() { return {}; } },
    model: vi.fn().mockReturnValue({}),
    models: {}, // This fixes the "reading User" error
    connect: vi.fn().mockResolvedValue(true),
    connection: { readyState: 1 },
  };
  return { ...m, default: m };
});

vi.mock('@pinecone-database/pinecone', () => ({
  Pinecone: class { constructor() { this.Index = vi.fn().mockReturnValue({ query: vi.fn() }); } }
}));

import app from "../app.js";

// ... top of the file remains the same ...

describe("Simple Admin Test", () => {
  it("denies access without password", async () => {
    const res = await request(app).get("/admin/stats");
    expect(res.status).toBe(400); // This is already passing!
  });

  it("grants access with correct password", async () => {
    const res = await request(app)
      .post("/admin/check-auth")
      .send({ password: "test-pass-123" });
    
    // CHANGE THIS LINE FROM 500 TO 200
    expect(res.status).toBe(200); 
    expect(res.body.success).toBe(true);
  });
});
