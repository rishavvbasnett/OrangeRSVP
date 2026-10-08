import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { createUserPayload } from "../../shared/test/createPayload.js";
import { users } from "./users.schema.js";
import db from "../../shared/config/db.js";
import userService from "./users.service.js";
import { ResourceNotFoundError } from "../../shared/utils/errorClasses.js";
import type { ProfileUpdate, UserInput } from "./users.types.js";
import bcrypt from "bcrypt";

describe("getUser", () => {
  it("returns UserDto with valid userId", async () => {
    const user1Payload = createUserPayload({
      name: "user1",
      email: "user1@gmail.com",
    });
    const [savedUser1] = await db
      .insert(users)
      .values(user1Payload)
      .returning();
    const foundUser1 = await userService.getUser(savedUser1.id);
    expect(foundUser1.name).toBe(savedUser1.name);
    expect(foundUser1.email).toBe(savedUser1.email);
    expect(foundUser1).not.toHaveProperty("passwordHash");
  });

  it("throws ResourceNotFoundError with invalid userId", async () => {
    await expect(userService.getUser(99)).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it("returns every DTO field and nothing else", async () => {
    const [savedUser] = await db
      .insert(users)
      .values(createUserPayload())
      .returning();

    const foundUser = await userService.getUser(savedUser.id);

    const expectedDto = {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      phone: savedUser.phone,
      platformRole: savedUser.platformRole,
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
    expect(foundUser).toStrictEqual(expectedDto);
  });

  it("returns the requested user when several users exist", async () => {
    await db
      .insert(users)
      .values(createUserPayload({ name: "first", email: "first@example.com" }));
    const [secondUser] = await db
      .insert(users)
      .values(
        createUserPayload({ name: "second", email: "second@example.com" }),
      )
      .returning();

    const foundUser = await userService.getUser(secondUser.id);

    expect(foundUser.id).toBe(secondUser.id);
    expect(foundUser.name).toBe("second");
  });

  it("returns a user that has no phone with phone as null", async () => {
    const [savedUser] = await db
      .insert(users)
      .values(createUserPayload({ phone: null }))
      .returning();

    const foundUser = await userService.getUser(savedUser.id);

    expect(foundUser.phone).toBeNull();
  });
});

describe("createUser", () => {
  const signupInput: UserInput = {
    name: "New User",
    email: "new.user@example.com",
    phone: "+14155552671",
    password: "Password123!",
  };

  it("stores a bcrypt hash, never the plain password", async () => {
    const createdUser = await userService.createUser(signupInput);

    const [storedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, createdUser.id));
    const passwordMatches = await bcrypt.compare(
      signupInput.password,
      storedUser.passwordHash,
    );

    expect(storedUser.passwordHash).not.toBe(signupInput.password);
    expect(passwordMatches).toBe(true);
  });

  it("returns a DTO without passwordHash and always creates a customer", async () => {
    const createdUser = await userService.createUser(signupInput);

    expect(createdUser).not.toHaveProperty("passwordHash");
    expect(createdUser.email).toBe(signupInput.email);
    expect(createdUser.platformRole).toBe("customer");
    expect(createdUser.isActive).toBe(true);
  });

  it("stores phone as null when it is not provided", async () => {
    const inputWithoutPhone: UserInput = {
      name: "No Phone",
      email: "no.phone@example.com",
      password: "Password123!",
    };

    const createdUser = await userService.createUser(inputWithoutPhone);

    expect(createdUser.phone).toBeNull();
  });

  it("rejects a duplicate email with 23505 and keeps one row", async () => {
    await userService.createUser(signupInput);

    await expect(userService.createUser(signupInput)).rejects.toMatchObject({
      cause: { code: "23505", constraint: "users_email_uq" },
    });

    const rows = await db.select().from(users);
    expect(rows).toHaveLength(1);
  });
});

describe("updateProfile", () => {
  it("updates only the given field and leaves the others unchanged", async () => {
    const [savedUser] = await db
      .insert(users)
      .values(createUserPayload({ name: "Old Name", phone: "+14155550000" }))
      .returning();

    const updatedUser = await userService.updateProfile(savedUser.id, {
      name: "New Name",
    });

    expect(updatedUser.name).toBe("New Name");
    expect(updatedUser.phone).toBe("+14155550000");
    expect(updatedUser.email).toBe(savedUser.email);
  });

  it("persists the change", async () => {
    const [savedUser] = await db
      .insert(users)
      .values(createUserPayload())
      .returning();

    await userService.updateProfile(savedUser.id, { phone: "+14155559999" });

    const [storedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, savedUser.id));
    expect(storedUser.phone).toBe("+14155559999");
  });

  it("ignores extra keys like email, role, and isActive (mass assignment)", async () => {
    const [savedUser] = await db
      .insert(users)
      .values(createUserPayload())
      .returning();
    const maliciousUpdate = {
      name: "Sneaky",
      email: "attacker@example.com",
      platformRole: "admin",
      isActive: false,
    } as unknown as ProfileUpdate;

    await userService.updateProfile(savedUser.id, maliciousUpdate);

    const [storedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, savedUser.id));
    expect(storedUser.name).toBe("Sneaky");
    expect(storedUser.email).toBe(savedUser.email);
    expect(storedUser.platformRole).toBe("customer");
    expect(storedUser.isActive).toBe(true);
  });

  it("changes only the target user", async () => {
    const [targetUser] = await db
      .insert(users)
      .values(
        createUserPayload({ name: "Target", email: "target@example.com" }),
      )
      .returning();
    const [otherUser] = await db
      .insert(users)
      .values(createUserPayload({ name: "Other", email: "other@example.com" }))
      .returning();

    await userService.updateProfile(targetUser.id, { name: "Changed" });

    const [storedOther] = await db
      .select()
      .from(users)
      .where(eq(users.id, otherUser.id));
    expect(storedOther.name).toBe("Other");
  });

  it("throws ResourceNotFoundError for a missing user", async () => {
    await expect(
      userService.updateProfile(99, { name: "Nobody" }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});

describe("deactivateUser", () => {
  it("sets isActive to false and persists it", async () => {
    const [savedUser] = await db
      .insert(users)
      .values(createUserPayload())
      .returning();

    const deactivatedUser = await userService.deactivateUser(savedUser.id);

    const [storedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, savedUser.id));
    expect(deactivatedUser.isActive).toBe(false);
    expect(storedUser.isActive).toBe(false);
  });

  it("keeps the row (soft delete, no hard delete)", async () => {
    const [savedUser] = await db
      .insert(users)
      .values(createUserPayload())
      .returning();

    await userService.deactivateUser(savedUser.id);

    const rows = await db.select().from(users);
    expect(rows).toHaveLength(1);
  });

  it("is idempotent: deactivating twice succeeds", async () => {
    const [savedUser] = await db
      .insert(users)
      .values(createUserPayload())
      .returning();

    await userService.deactivateUser(savedUser.id);
    const secondResult = await userService.deactivateUser(savedUser.id);

    expect(secondResult.isActive).toBe(false);
  });

  it("deactivates only the target user", async () => {
    const [targetUser] = await db
      .insert(users)
      .values(createUserPayload({ email: "target@example.com" }))
      .returning();
    const [otherUser] = await db
      .insert(users)
      .values(createUserPayload({ email: "other@example.com" }))
      .returning();

    await userService.deactivateUser(targetUser.id);

    const [storedOther] = await db
      .select()
      .from(users)
      .where(eq(users.id, otherUser.id));
    expect(storedOther.isActive).toBe(true);
  });

  it("throws ResourceNotFoundError for a missing user", async () => {
    await expect(userService.deactivateUser(99)).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});

describe("users table (persistence and constraints)", () => {
  it("starts every test with an empty table and ids from 1", async () => {
    const rowsBefore = await db.select().from(users);
    expect(rowsBefore).toHaveLength(0);

    const [savedUser] = await db
      .insert(users)
      .values(createUserPayload())
      .returning();
    expect(savedUser.id).toBe(1);
  });

  it("applies database defaults for role, active flag, and timestamps", async () => {
    const [savedUser] = await db
      .insert(users)
      .values(createUserPayload())
      .returning();

    expect(savedUser.platformRole).toBe("customer");
    expect(savedUser.isActive).toBe(true);
    expect(savedUser.createdAt).toBeInstanceOf(Date);
    expect(savedUser.updatedAt).toBeInstanceOf(Date);
  });

  it("persists the row so a fresh query reads the same values", async () => {
    const [savedUser] = await db
      .insert(users)
      .values(createUserPayload({ email: "persist@example.com" }))
      .returning();

    const [rereadUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, savedUser.id));

    expect(rereadUser).toStrictEqual(savedUser);
  });

  it("rejects a duplicate email with 23505 on users_email_uq", async () => {
    const payload = createUserPayload({ email: "same@example.com" });
    await db.insert(users).values(payload);

    await expect(db.insert(users).values(payload)).rejects.toMatchObject({
      cause: { code: "23505", constraint: "users_email_uq" },
    });

    const rows = await db.select().from(users);
    expect(rows).toHaveLength(1);
  });

  it("rejects a non-lowercase email with 23514 on users_email_lowercase", async () => {
    const payload = createUserPayload({ email: "Mixed@Example.com" });

    await expect(db.insert(users).values(payload)).rejects.toMatchObject({
      cause: { code: "23514", constraint: "users_email_lowercase" },
    });
  });

  it("rejects a missing name with 23502", async () => {
    const payload = createUserPayload();
    const payloadWithNullName = { ...payload, name: null as unknown as string };

    await expect(
      db.insert(users).values(payloadWithNullName),
    ).rejects.toMatchObject({
      cause: { code: "23502", column: "name" },
    });
  });

  it("allows only one of many concurrent inserts with the same email", async () => {
    const payload = createUserPayload({ email: "race@example.com" });
    const attempts = Array.from({ length: 10 }, () => {
      return db.insert(users).values(payload);
    });

    const results = await Promise.allSettled(attempts);

    const succeeded = results.filter((result) => result.status === "fulfilled");
    const failed = results.filter((result) => result.status === "rejected");
    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(9);

    const rows = await db.select().from(users);
    expect(rows).toHaveLength(1);
  });
});
