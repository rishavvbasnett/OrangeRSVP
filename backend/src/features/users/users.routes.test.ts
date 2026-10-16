import { describe, it, expect } from "vitest";
import app from "../../app.js";
import request from "supertest";
import db from "../../shared/config/db.js";
import { users } from "./users.schema.js";
import { eq } from "drizzle-orm";

const api = request(app);

describe("POST /users", () => {
  describe("HAPPY PATH", () => {
    it("HAPPY PATH: returns UserDto and persists user with: VALID INPUT", async () => {
      const signupBody = {
        name: "user1",
        email: "user1@gmail.com",
        phone: "+14959595959",
        password: "1234",
      };
      const response = await api.post("/users").send(signupBody);

      expect(response.status).toBe(201);
      expect(response.body.email).toBe("user1@gmail.com");
      expect(response.body.platformRole).toBe("customer");
      expect(response.body).not.toHaveProperty("passwordHash");

      const [storedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, response.body.id));
      expect(storedUser.email).toBe("user1@gmail.com");
    });
  });

  describe("VALIDATION FAILURES", () => {
    it.each([
      { label: "empty body", payload: {} },
      {
        label: "missing name",
        payload: { email: "a@example.com", password: "pw" },
      },
      {
        label: "empty name",
        payload: { name: "", email: "a@example.com", password: "pw" },
      },
      {
        label: "name is only spaces",
        payload: { name: "   ", email: "a@example.com", password: "pw" },
      },
      {
        label: "name is not a string",
        payload: { name: 123, email: "a@example.com", password: "pw" },
      },
      { label: "missing email", payload: { name: "a", password: "pw" } },
      {
        label: "empty email",
        payload: { name: "a", email: "", password: "pw" },
      },
      {
        label: "email without @",
        payload: { name: "a", email: "not-an-email", password: "pw" },
      },
      {
        label: "email is only spaces",
        payload: { name: "a", email: "   ", password: "pw" },
      },
      {
        label: "missing password",
        payload: { name: "a", email: "a@example.com" },
      },
      {
        label: "empty password",
        payload: { name: "a", email: "a@example.com", password: "" },
      },
      {
        label: "password is not a string",
        payload: { name: "a", email: "a@example.com", password: 123 },
      },
      {
        label: "phone not E.164",
        payload: {
          name: "a",
          email: "a@example.com",
          phone: "415-555-2671",
          password: "pw",
        },
      },
      {
        label: "phone is not a string",
        payload: {
          name: "a",
          email: "a@example.com",
          phone: 4155552671,
          password: "pw",
        },
      },
    ])("returns 400 and creates no user with: $label", async ({ payload }) => {
      const response = await api.post("/users").send(payload);
      expect(response.status).toBe(400);
      expect(await db.select().from(users)).toHaveLength(0);
    });

    it("returns 409 for a duplicate email and keeps one row", async () => {
      const signupBody = {
        name: "first",
        email: "same@example.com",
        password: "Password123!",
      };
      const firstResponse = await api.post("/users").send(signupBody);
      expect(firstResponse.status).toBe(201);

      const duplicateBody = {
        name: "second",
        email: "  SAME@Example.com ",
        password: "Password123!",
      };
      const secondResponse = await api.post("/users").send(duplicateBody);

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.error).toBe("Resource already exists");

      const storedUsers = await db.select().from(users);
      expect(storedUsers).toHaveLength(1);
    });
  });

  describe("OTHERS", () => {
    it("works without an Authorization header (signup is public)", async () => {
      const signupBody = {
        name: "public",
        email: "public@example.com",
        password: "Password123!",
      };

      const response = await api.post("/users").send(signupBody);

      expect(response.status).toBe(201);
    });

    it("ignores platformRole in the body and always creates a customer", async () => {
      const escalationBody = {
        name: "sneaky",
        email: "sneaky@example.com",
        password: "Password123!",
        platformRole: "admin",
      };

      const response = await api.post("/users").send(escalationBody);

      expect(response.status).toBe(201);
      expect(response.body.platformRole).toBe("customer");

      const [storedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, response.body.id));
      expect(storedUser.platformRole).toBe("customer");
    });

    it("ignores isActive in the body and always creates an active user", async () => {
      const inactiveBody = {
        name: "inactive",
        email: "inactive@example.com",
        password: "Password123!",
        isActive: false,
      };

      const response = await api.post("/users").send(inactiveBody);

      expect(response.status).toBe(201);
      expect(response.body.isActive).toBe(true);

      const [storedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, response.body.id));
      expect(storedUser.isActive).toBe(true);
    });

    it("returns 429 on the 6th signup within the window", async () => {
      for (let attempt = 1; attempt <= 5; attempt++) {
        const signupBody = {
          name: "user",
          email: `user${attempt}@example.com`,
          password: "Password123!",
        };
        const response = await api.post("/users").send(signupBody);
        expect(response.status).toBe(201);
      }

      const sixthBody = {
        name: "user",
        email: "user6@example.com",
        password: "Password123!",
      };
      const sixthResponse = await api.post("/users").send(sixthBody);

      expect(sixthResponse.status).toBe(429);
    });

    it("returns one 201 & four 409 on 5 concurrent signups with the same email", async () => {
      const signupBody = {
        name: "race",
        email: "race@gmail.com",
        password: "123",
      };

      const requests = [];
      for (let index = 0; index < 5; index++) {
        requests.push(api.post("/users").send(signupBody));
      }
      const responses = await Promise.all(requests);

      let createdCount = 0;
      let conflictCount = 0;
      for (const response of responses) {
        if (response.status === 201) createdCount++;
        if (response.status === 409) conflictCount++;
      }
      expect(createdCount).toBe(1);
      expect(conflictCount).toBe(4);
    });
  });
});

describe("GET ");
