import type { Build } from '@/types/build.types';
import Dexie, { type Table } from 'dexie';

class BuildPlannerDexie extends Dexie {
  builds!: Table<Build>;

  constructor() {
    super('ascension-build-planner');
    this.version(1).stores({
      builds: '++id, &name',
    })
  }
}

export const db = new BuildPlannerDexie();
