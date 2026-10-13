import { describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import app from "../../app.js";
import db from "../config/db.js";
import redis from "../config/redis.js";
import { users } from "../../features/users/users.schema.js";
import userService, {
  SALT_ROUNDS,
} from "../../features/users/users.service.js";
import { signAccessToken } from "../../features/auth/auth.tokens.js";
import { createUserPayload } from "../test/createPayload.js";

const seedAdmin = async () => {
  const passwordHash = await bcrypt.hash("1", SALT_ROUNDS);
  const [savedAdmin] = await db
    .insert(users)
    .values(
      createUserPayload({
        name: "admin",
        email: "admin@example.com",
        passwordHash,
        platformRole: "admin",
      }),
    )
    .returning();
  return savedAdmin;
};

const getUserWithToken = (userId: number, accessToken: string) => {
  return request(app)
    .get(`/users/${userId}`)
    .set("Authorization", `Bearer ${accessToken}`);
};

describe("loadActor (L2)", () => {
  it("HAPPY PATH: active admin passes and the actor gets cached", async () => {
    const admin = await seedAdmin();
    const accessToken = signAccessToken(admin.id, "admin");

    const response = await getUserWithToken(admin.id, accessToken);

    expect(response.status).toBe(200);
    const cachedActor = await redis.get(`actor:${admin.id}`);
    expect(cachedActor).not.toBeNull();
  });

  it("returns 401 for a still-valid token of a deactivated user", async () => {
    const admin = await seedAdmin();
    const accessToken = signAccessToken(admin.id, "admin");
    await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, admin.id));

    const response = await getUserWithToken(admin.id, accessToken);

    expect(response.status).toBe(401);
  });

  it("returns 401 for a token whose user no longer exists", async () => {
    const accessToken = signAccessToken(999, "admin");

    const response = await getUserWithToken(999, accessToken);

    expect(response.status).toBe(401);
  });

  it("returns 403 for a demoted admin using an old admin token", async () => {
    const admin = await seedAdmin();
    const oldAdminToken = signAccessToken(admin.id, "admin");
    await db
      .update(users)
      .set({ platformRole: "customer" })
      .where(eq(users.id, admin.id));

    const response = await getUserWithToken(admin.id, oldAdminToken);

    expect(response.status).toBe(403);
  });

  it("deactivation takes effect even when the actor is already cached", async () => {
    const admin = await seedAdmin();
    const accessToken = signAccessToken(admin.id, "admin");

    const firstResponse = await getUserWithToken(admin.id, accessToken);
    expect(firstResponse.status).toBe(200);

    await userService.deactivateUser(admin.id);

    const secondResponse = await getUserWithToken(admin.id, accessToken);
    expect(secondResponse.status).toBe(401);
  });
});
