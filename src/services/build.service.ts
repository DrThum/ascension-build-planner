import type { Build } from '@/types/build.types';

import { db } from '../repositories/database';

export async function save(build: Build) {
  return await db.builds.add(build);
}

export function list() {
  return db.builds.toArray();
}
