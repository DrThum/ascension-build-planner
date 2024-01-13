import type { Build } from '@/types/build.types';

import { db } from '../repositories/database';

export async function upsert(build: Build) {
  return await db.builds.put(build);
}

export function list() {
  return db.builds.toArray();
}
