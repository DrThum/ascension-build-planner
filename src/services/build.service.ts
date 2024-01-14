import type { Build } from '@/types/build.types';

import { db } from '../repositories/database';

export async function upsert(build: Build) {
  return await db.builds.put(build) as number;
}

export async function deleteById(id: number) {
  await db.builds.delete(id);
}

export function list() {
  return db.builds.toArray();
}
