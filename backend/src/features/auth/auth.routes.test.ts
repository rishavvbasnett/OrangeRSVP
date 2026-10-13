import { describe, it, expect } from "vitest";
import { createUserPayload } from "../../shared/test/createPayload.js";
import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "../users/users.service.js";
import db from "../../shared/config/db.js";
import { users } from "../users/users.schema.js";
import request from "supertest";
import app from "../../app.js";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import env from "../../shared/config/env.js";
import { signAccessToken } from "./auth.tokens.js";

const seedUser1 = async () =>
  await db.insert(users).values(
    createUserPayload({
      name: "user1",
      email: "user1@gmail.com",
      passwordHash: bcrypt.hashSync("1", SALT_ROUNDS),
      isActive: true,
      platformRole: "admin",
    }),
  );

const seedUser2 = async () =>
  await db.insert(users).values(
    createUserPayload({
      name: "user2",
      email: "user2@gmail.com",
      passwordHash: bcrypt.hashSync("2", SALT_ROUNDS),
      isActive: false,
      platformRole: "customer",
    }),
  );

describe("POST /auth/login", () => {
  it.each([
    {
      label: "lowercase email",
      userEmail: "user1@gmail.com",
    },
    {
      label: "lowercase email & trailing spaces",
      userEmail: " user1@gmail.com ",
    },
    {
      label: "mixed case email & trailing spaces",
      userEmail: "USeR1@Gmail.Com ",
    },
  ])(
    "HAPPY PATH: returns 200 & user object and token pair with $label",
    async ({ userEmail }) => {
      await seedUser1();
      const response = await request(app).post("/auth/login").send({
        email: userEmail,
        password: "1",
      });
      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe("user1@gmail.com");
      expect(response.body.user.platformRole).toBe("admin");
      expect(response.body.user.passwordHash).toBeUndefined();

      expect(response.body.tokenPair.refreshToken).toBeDefined();
      expect(response.body.tokenPair.accessToken).toBeDefined();
    },
  );

  it.each([
    {
      label: "unknown email",
      credential: {
        email: "user3@gmail.com",
        password: "1",
      },
    },
    {
      label: "wrong password",
      credential: {
        email: "user1@gmail.com",
        password: "3",
      },
    },
  ])("returns 401 with $label", async ({ credential }) => {
    await seedUser1();
    const response = await request(app).post("/auth/login").send(credential);
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid email or password");
    expect(response.body.tokenPair).toBeUndefined();
  });

  it.each([
    {
      label: "missing email",
      credential: {
        email: undefined,
        password: "1",
      },
    },
    {
      label: "missing password",
      credential: {
        email: "user1@gmail.com",
        password: undefined,
      },
    },
  ])("returns 400 with $label", async ({ credential }) => {
    await seedUser1();
    const response = await request(app).post("/auth/login").send(credential);
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.tokenPair).toBeUndefined();
  });

  it("returns 401 with specific message with correct credentials but isActive: false", async () => {
    await seedUser2();
    const response = await request(app).post("/auth/login").send({
      email: "user2@gmail.com",
      password: "2",
    });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Account deactivated. Contact support");
    expect(response.body.tokenPair).toBeUndefined();
  });

  it("RATE LIMITING: returns 429 on >= 6 requests within 60 seconds", async () => {
    await seedUser1();
    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await request(app).post("/auth/login").send({
        email: "user1@gmail.com",
        password: "1",
      });
      expect(response.status).not.toBe(429);
    }
    const response = await request(app).post("/auth/login").send({
      email: "user1@gmail.com",
      password: "1",
    });
    expect(response.status).toBe(429);
    expect(response.body.error).toBe("Rate limit exceeded");
    expect(response.body.user).toBeUndefined();
    expect(response.body.tokenPair).toBeUndefined();
  });

  it("rate limits only for one ip (not all ips)", async () => {
    const sendRequestForIp = async (ip: string) =>
      await request(app).post("/auth/login").set("X-Forwarded-For", ip).send({
        email: "user1@gmail.com",
        password: "1",
      });
    for (let attempt = 1; attempt <= 6; attempt++) {
      await sendRequestForIp("1.2.3.4");
    }
    const response = await sendRequestForIp("5.6.7.8");
    expect(response.status).not.toBe(429);
  });
});

describe("POST /auth/refresh", () => {
  it("HAPPY PATH: returns a new tokenPair with valid refresh token", async () => {
    await seedUser1();
    const response1 = await request(app).post("/auth/login").send({
      email: "user1@gmail.com",
      password: "1",
    });
    const oldToken = response1.body.tokenPair.refreshToken;

    const response2 = await request(app).post("/auth/refresh").send({
      refreshToken: oldToken,
    });
    const newToken = response2.body.tokenPair.refreshToken;
    expect(response2.status).toBe(200);
    expect(response2.body.user).toBeDefined();
    expect(response2.body.tokenPair).toBeDefined();
    expect(response2.body.tokenPair.refreshToken).not.toBe(oldToken);

    const response3 = await request(app).post("/auth/refresh").send({
      refreshToken: oldToken,
    });
    expect(response3.status).toBe(401);

    const response4 = await request(app).post("/auth/refresh").send({
      refreshToken: newToken,
    });
    expect(response4.status).toBe(200);
    expect(response4.body.user).toBeDefined();
    expect(response4.body.tokenPair).toBeDefined();
  });

  it("returns 401 with invalid refresh token", async () => {
    const response = await request(app).post("/auth/refresh").send({
      refreshToken: "invalidtoken",
    });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid or expired session");
    expect(response.body.user).toBeUndefined();
    expect(response.body.tokenPair).toBeUndefined();
  });

  it.each([
    {
      label: "no body",
      body: undefined,
    },
    {
      label: "missing refreshToken key",
      body: {},
    },
    {
      label: "unrelated key only",
      body: { randomKey: "randomValue" },
    },
  ])("returns 400 with $label", async ({ body }) => {
    const response = await request(app).post("/auth/refresh").send(body);
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.user).toBeUndefined();
    expect(response.body.tokenPair).toBeUndefined();
  });

  it("returns 401 when user is deactivated after login", async () => {
    await seedUser1();
    const loginResponse = await request(app).post("/auth/login").send({
      email: "user1@gmail.com",
      password: "1",
    });
    const refreshToken = loginResponse.body.tokenPair.refreshToken;

    await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.email, "user1@gmail.com"));

    const response = await request(app).post("/auth/refresh").send({
      refreshToken,
    });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid or expired session");
    expect(response.body.user).toBeUndefined();
    expect(response.body.tokenPair).toBeUndefined();
  });

  it("CONCURRENCY: 10 concurrent refreshes with the same token return exactly one 200 and nine 401s", async () => {
    await seedUser1();
    const loginResponse = await request(app).post("/auth/login").send({
      email: "user1@gmail.com",
      password: "1",
    });
    const refreshToken = loginResponse.body.tokenPair.refreshToken;

    const requests = [];
    for (let i = 0; i < 10; i++) {
      const pendingRequest = request(app)
        .post("/auth/refresh")
        .send({ refreshToken });
      requests.push(pendingRequest);
    }
    const responses = await Promise.all(requests);

    let successCount = 0;
    let unauthorizedCount = 0;
    for (const response of responses) {
      if (response.status === 200) {
        successCount++;
      }
      if (response.status === 401) {
        unauthorizedCount++;
        expect(response.body.error).toBe("Invalid or expired session");
        expect(response.body.tokenPair).toBeUndefined();
      }
    }
    expect(successCount).toBe(1);
    expect(unauthorizedCount).toBe(9);
  });
});

describe("POST /auth/logout", () => {
  const loginAsUser1 = async () => {
    await seedUser1();
    const loginResponse = await request(app).post("/auth/login").send({
      email: "user1@gmail.com",
      password: "1",
    });
    const accessToken: string = loginResponse.body.tokenPair.accessToken;
    const refreshToken: string = loginResponse.body.tokenPair.refreshToken;
    return { accessToken, refreshToken };
  };

  const refreshWith = (refreshToken: string) => {
    return request(app).post("/auth/refresh").send({ refreshToken });
  };

  const getAdminRouteWith = (accessToken: string) => {
    return request(app)
      .get("/users/1")
      .set("Authorization", `Bearer ${accessToken}`);
  };

  it("HAPPY PATH: returns 204 with an empty body", async () => {
    const { accessToken, refreshToken } = await loginAsUser1();

    const response = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it("revokes the refresh token", async () => {
    const { accessToken, refreshToken } = await loginAsUser1();

    await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken });

    const refreshResponse = await refreshWith(refreshToken);
    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.tokenPair).toBeUndefined();
  });

  it("blocklists the access token", async () => {
    const { accessToken, refreshToken } = await loginAsUser1();

    const beforeLogoutResponse = await getAdminRouteWith(accessToken);
    expect(beforeLogoutResponse.status).toBe(200);

    await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken });

    const afterLogoutResponse = await getAdminRouteWith(accessToken);
    expect(afterLogoutResponse.status).toBe(401);
  });

  it.each([
    {
      label: "no Authorization header",
      authorizationHeader: undefined,
    },
    {
      label: "garbage access token",
      authorizationHeader: "Bearer not-a-real-jwt",
    },
  ])(
    "returns 204 and still revokes the refresh token with $label",
    async ({ authorizationHeader }) => {
      const { refreshToken } = await loginAsUser1();

      const logoutRequest = request(app).post("/auth/logout");
      if (authorizationHeader) {
        logoutRequest.set("Authorization", authorizationHeader);
      }
      const logoutResponse = await logoutRequest.send({ refreshToken });

      expect(logoutResponse.status).toBe(204);

      const refreshResponse = await refreshWith(refreshToken);
      expect(refreshResponse.status).toBe(401);
    },
  );

  it("returns 400 when refreshToken is missing", async () => {
    const response = await request(app).post("/auth/logout").send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});

describe("authenticate + requireRole (via GET /users/:id, admin only)", () => {
  // Must match the issuer/audience in auth.tokens.ts.
  const JWT_ISSUER = "orangersvp-api";
  const JWT_AUDIENCE = "orangersvp-client";

  const getUser1With = (authorizationHeader?: string) => {
    const getRequest = request(app).get("/users/1");
    if (authorizationHeader) {
      getRequest.set("Authorization", authorizationHeader);
    }
    return getRequest;
  };

  const signCustomToken = (
    signOptions: jwt.SignOptions,
    secret: string = env.JWT_SECRET,
  ): string => {
    const payload = { platformRole: "admin" };
    const defaultOptions: jwt.SignOptions = {
      algorithm: "HS256",
      expiresIn: 600,
      jwtid: randomUUID(),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      subject: "1",
    };
    const token = jwt.sign(payload, secret, { ...defaultOptions, ...signOptions });
    return token;
  };

  it("HAPPY PATH: admin token returns 200", async () => {
    await seedUser1();
    const adminToken = signAccessToken(1, "admin");

    const response = await getUser1With(`Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
    expect(response.body.passwordHash).toBeUndefined();
  });

  it("customer token returns 403", async () => {
    await seedUser1();
    const customerToken = signAccessToken(2, "customer");

    const response = await getUser1With(`Bearer ${customerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Forbidden");
  });

  it("no Authorization header returns 401", async () => {
    const response = await getUser1With();

    expect(response.status).toBe(401);
  });

  it.each([
    { label: "wrong scheme", authorizationHeader: "Token abc" },
    { label: "Bearer with no token", authorizationHeader: "Bearer" },
    { label: "garbage JWT", authorizationHeader: "Bearer not-a-real-jwt" },
  ])("returns 401 with $label", async ({ authorizationHeader }) => {
    const response = await getUser1With(authorizationHeader);

    expect(response.status).toBe(401);
  });

  it("tampered signature returns 401", async () => {
    await seedUser1();
    const validToken = signAccessToken(1, "admin");
    const [header, payload, signature] = validToken.split(".");

    // Change a middle character: the last base64url character carries padding
    // bits, so changing it can decode to the same bytes and stay valid.
    const middleIndex = Math.floor(signature.length / 2);
    const originalCharacter = signature[middleIndex];
    const replacementCharacter = originalCharacter === "A" ? "B" : "A";
    const tamperedSignature =
      signature.slice(0, middleIndex) +
      replacementCharacter +
      signature.slice(middleIndex + 1);
    const tamperedToken = `${header}.${payload}.${tamperedSignature}`;

    const response = await getUser1With(`Bearer ${tamperedToken}`);

    expect(response.status).toBe(401);
  });

  it("expired token returns 401 'Token expired'", async () => {
    await seedUser1();
    const expiredToken = signCustomToken({ expiresIn: -10 });

    const response = await getUser1With(`Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token expired");
  });

  it.each([
    {
      label: "wrong secret",
      buildToken: () => signCustomToken({}, "some-other-secret"),
    },
    {
      label: "wrong algorithm (HS512, not pinned HS256)",
      buildToken: () => signCustomToken({ algorithm: "HS512" }),
    },
    {
      label: "wrong issuer",
      buildToken: () => signCustomToken({ issuer: "someone-else" }),
    },
    {
      label: "wrong audience",
      buildToken: () => signCustomToken({ audience: "someone-else" }),
    },
  ])("returns 401 with $label", async ({ buildToken }) => {
    await seedUser1();
    const token = buildToken();

    const response = await getUser1With(`Bearer ${token}`);

    expect(response.status).toBe(401);
  });

  it("token without platformRole claim returns 401", async () => {
    await seedUser1();
    const tokenWithoutRole = jwt.sign({}, env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: 600,
      jwtid: randomUUID(),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      subject: "1",
    });

    const response = await getUser1With(`Bearer ${tokenWithoutRole}`);

    expect(response.status).toBe(401);
  });
});
