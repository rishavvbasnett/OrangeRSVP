import { eq } from "drizzle-orm";
import db from "../../shared/config/db.js";
import redis from "../../shared/config/redis.js";
import { users } from "../users/users.schema.js";
import type { Actor } from "./auth.types.js";

const ACTOR_CACHE_TTL_SECONDS = 60;

const actorCacheKey = (userId: number): string => {
  return `actor:${userId}`;
};

const readCachedActor = async (userId: number): Promise<Actor | null> => {
  try {
    const cachedValue = await redis.get(actorCacheKey(userId));
    if (!cachedValue) return null;

    const cachedActor: Actor = JSON.parse(cachedValue);
    return cachedActor;
  } catch {
    return null;
  }
};

const writeCachedActor = async (actor: Actor): Promise<void> => {
  await redis.setex(
    actorCacheKey(actor.id),
    ACTOR_CACHE_TTL_SECONDS,
    JSON.stringify(actor),
  );
};

const loadActorFromDatabase = async (userId: number): Promise<Actor | null> => {
  const [foundUser] = await db
    .select({
      id: users.id,
      platformRole: users.platformRole,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!foundUser) return null;

  return foundUser;
};

export const getActor = async (userId: number): Promise<Actor | null> => {
  const cactchedActor = await readCachedActor(userId);
  if (cactchedActor) return cactchedActor;

  const databaseActor = await loadActorFromDatabase(userId);
  if (!databaseActor) return null;

  await writeCachedActor(databaseActor);
  return databaseActor;
};

export const invalidateActorCache = async (userId: number): Promise<void> => {
  await redis.del(actorCacheKey(userId));
};
