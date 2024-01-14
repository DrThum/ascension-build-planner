import type { Build } from '@/types/build.types';
import type { CollectedCard } from '@/types/cards.types';
import Dexie, { type Table } from 'dexie';

class BuildPlannerDexie extends Dexie {
  builds!: Table<Build>;
  abilityCards!: Table<CollectedCard>;
  abilityGoldenCards!: Table<CollectedCard>;
  talentCards!: Table<CollectedCard>;
  talentGoldenCards!: Table<CollectedCard>;

  constructor() {
    super('ascension-build-planner');
    this.version(2).stores({
      builds: '++id, &name',
      abilityCards: '&cardId',
      abilityGoldenCards: '&cardId',
      talentCards: '&cardId',
      talentGoldenCards: '&cardId',
    })
  }
}

export const db = new BuildPlannerDexie();
