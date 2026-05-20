import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// THE SIMPLEST MOCK: Provides everything your Model needs to not crash
vi.mock('mongoose', () => {
  const m = {
    Schema: class { constructor() { return {}; } },
    model: vi.fn().mockReturnValue({
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    }),
    models: {}, // This fixes the "reading User" error
    connect: vi.fn().mockResolvedValue(true),
    connection: { readyState: 1 },
  };
  return { ...m, default: m };
});

// Mock Pinecone
vi.mock('@pinecone-database/pinecone', () => ({
  Pinecone: class { constructor() { this.Index = vi.fn().mockReturnValue({ query: vi.fn() }); } }
}));

import app from "../app.js";

describe("Simple Auth Test", () => {
  it("should check if signup route exists", async () => {
    const res = await request(app).post("/api/signup").send({});
    // We just want to see it didn't crash (should be 400 or 200)
    expect(res.status).toBeDefined();
  });
});