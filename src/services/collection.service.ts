import type { CardCollection } from '@/types/cards.types';
import { db } from '../repositories/database';

export async function getCollection(): Promise<CardCollection> {
  return {
    abilityNormal: await db.abilityCards.toArray(),
    abilityGolden: await db.abilityGoldenCards.toArray(),
    talentNormal: await db.talentCards.toArray(),
    talentGolden: await db.talentGoldenCards.toArray(),
  };
}

export async function replaceCollection(collection: CardCollection) {
  await db.abilityCards.clear();
  for (const card of collection.abilityNormal) {
    await db.abilityCards.put(card);
  }

  await db.abilityGoldenCards.clear();
  for (const card of collection.abilityGolden) {
    await db.abilityGoldenCards.put(card);
  }

  await db.talentCards.clear();
  for (const card of collection.talentNormal) {
    await db.talentCards.put(card);
  }

  await db.talentGoldenCards.clear();
  for (const card of collection.talentGolden) {
    await db.talentGoldenCards.put(card);
  }
}
