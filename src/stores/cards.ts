import { defineStore } from 'pinia';

import type { Card, CardCollection, CardQuality } from '@/types/cards.types';
import _ from 'lodash';
import skillCards from '../assets/skill_cards.json';

export const useCardsStore = defineStore('cards', {
  state: () => ({
    collection: {
      abilityNormal: [],
      abilityGolden: [],
      talentNormal: [],
      talentGolden: [],
    } as CardCollection,
    abilities: buildCardsData(skillCards.abilities),
    talents: buildCardsData(skillCards.talents),
  }),
  actions: {
    setCollection(collection: CardCollection) {
      this.collection = collection;
    },
  },
  getters: {
    spellForCard: (state) => {
      // If overrideRank is undefined, use player's collected rank
      return (cardId: number, isGolden: boolean, overrideRank?: number) => {
        const relevantCollectedCards = isGolden
          ? state.collection.abilityGolden.concat(state.collection.talentGolden)
          : state.collection.abilityNormal.concat(state.collection.talentNormal);

        const rankToFind =
          overrideRank ?? relevantCollectedCards.find((c) => c.cardId === cardId)?.rank ?? 1;

        const abilityCard = state.abilities.find((a) => a.cardId === cardId);
        const abilitySpell = abilityCard && abilityCard.spells.find((s) => s.rank === rankToFind);

        const talentCard = state.talents.find((t) => t.cardId === cardId);
        const talentSpell = talentCard && talentCard.spells.find((s) => s.rank === rankToFind);

        if (abilitySpell) {
          return abilitySpell;
        } else if (talentSpell) {
          return talentSpell;
        } else {
          throw new Error(
            `spellForCard: user's collection contains an unknown card with id ${cardId} and rank ${rankToFind}`,
          );
        }
      };
    },
    collectedRank: (state) => {
      return (cardId: number, isGolden: boolean) => {
        const relevantCollectedCards = isGolden
          ? state.collection.abilityGolden.concat(state.collection.talentGolden)
          : state.collection.abilityNormal.concat(state.collection.talentNormal);

        return relevantCollectedCards.find((c) => c.cardId === cardId)?.rank ?? 0;
      };
    },
  },
});

// Build the actual card data (one card can contain multiple spells, one per rank)
// from the raw data that has one entry per card per spell
type RawCardData = {
  cardId: number;
  quality: string;
  spellId: number;
  spellName: string;
  rank: number;
  maxRank: number;
  description: string;
};

function buildCardsData(raw: RawCardData[]): Card[] {
  const allCards: Card[] = raw.reduce((acc, card) => {
    const thisCard = acc.find((c) => c.cardId === card.cardId);
    if (thisCard) {
      // Add this spell rank to the card and sort the spells by rank
      thisCard.spells.push({
        id: card.spellId,
        name: card.spellName,
        description: card.description,
        rank: card.rank,
      });
    } else {
      // Add this card to the accumulator
      acc.push({
        cardId: card.cardId,
        quality: card.quality as CardQuality,
        maxRank: card.maxRank,
        spells: [
          {
            id: card.spellId,
            name: card.spellName,
            description: card.description,
            rank: card.rank,
          },
        ],
      });
    }

    return acc;
  }, [] as Card[]);

  return _.sortBy(allCards, (card) => card.cardId);
}
