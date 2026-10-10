import { db } from '@/lib/db';
import { profile } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { NewProfile, Profile } from '@/lib/db/schema';

export async function getProfile(): Promise<Profile | null> {
  const result = await db.select().from(profile).limit(1);
  return result[0] ?? null;
}

export async function createProfile(data: NewProfile): Promise<Profile> {
  const result = await db.insert(profile).values(data).returning();
  return result[0];
}

export async function updateProfile(id: string, data: Partial<NewProfile>): Promise<Profile> {
  const result = await db
    .update(profile)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(profile.id, id))
    .returning();
  return result[0];
}

export async function deleteProfile(id: string): Promise<void> {
  await db.delete(profile).where(eq(profile.id, id));
}

export async function upsertProfile(data: NewProfile): Promise<Profile> {
  const existing = await getProfile();
  if (existing) {
    return updateProfile(existing.id, data);
  }
  return createProfile(data);
}