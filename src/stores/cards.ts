import { defineStore } from 'pinia';

import {
  CardCategory,
  type Card,
  type CardCollection,
  type CardQuality,
} from '@/types/cards.types';
import _ from 'lodash';

import { abilityGolden, abilityNormal } from '@/assets/ability_cards.json';
import { talentGolden, talentNormal } from '@/assets/talent_cards.json';

type CardCatalog = {
  ability: Card[];
  talent: Card[];
};

export const useCardsStore = defineStore('cards', {
  state: () => ({
    // Player collected cards
    collection: {
      abilityNormal: [],
      abilityGolden: [],
      talentNormal: [],
      talentGolden: [],
    } as CardCollection,
    // All available cards
    all: {
      ability: buildCardsData(abilityNormal, abilityGolden),
      talent: buildCardsData(talentNormal, talentGolden),
    } as CardCatalog,
  }),
  actions: {
    setCollection(collection: CardCollection) {
      this.collection = collection;
    },
  },
  getters: {
    spellForCard: (state) => {
      // If overrideRank is undefined, use player's collected rank
      return (cardId: number, category: CardCategory, isGolden: boolean, overrideRank?: number) => {
        let relevantCollectedCards = [];
        let relevantCardCatalog = [];
        if (category === CardCategory.Ability) {
          if (isGolden) {
            relevantCollectedCards = state.collection.abilityGolden;
          } else {
            relevantCollectedCards = state.collection.abilityNormal;
          }

          relevantCardCatalog = state.all.ability;
        } else {
          if (isGolden) {
            relevantCollectedCards = state.collection.talentGolden;
          } else {
            relevantCollectedCards = state.collection.talentNormal;
          }

          relevantCardCatalog = state.all.talent;
        }

        const rankToFind =
          overrideRank ?? relevantCollectedCards.find((c) => c.cardId === cardId)?.rank ?? 1;

        const card = relevantCardCatalog.find((a) =>
          isGolden ? a.goldenCardId === cardId : a.normalCardId === cardId,
        );
        const spell = card && card.spells.find((s) => s.rank === rankToFind);

        if (spell) {
          return spell;
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
  requiredLevel?: number;
};

function buildCardsData(rawNormal: RawCardData[], rawGolden: RawCardData[]): Card[] {
  const allCards: Card[] = rawNormal.reduce((acc, normalCard) => {
    const thisCard = acc.find((c) => c.normalCardId === normalCard.cardId);
    if (thisCard) {
      // Add this spell rank to the card and sort the spells by rank
      thisCard.spells.push({
        id: normalCard.spellId,
        name: normalCard.spellName,
        description: normalCard.description,
        rank: normalCard.rank,
      });
    } else {
      const goldenCard = rawGolden.find((r) => r.spellId === normalCard.spellId);

      if (!goldenCard) {
        console.error(`normal card id ${normalCard.cardId} has no golden equivalent`);
      }

      // Add this card to the accumulator
      acc.push({
        normalCardId: normalCard.cardId,
        goldenCardId: goldenCard?.cardId ?? 0,
        quality: normalCard.quality as CardQuality,
        maxRank: normalCard.maxRank,
        requiredLevel: normalCard.requiredLevel ?? 1,
        spells: [
          {
            id: normalCard.spellId,
            name: normalCard.spellName,
            description: normalCard.description,
            rank: normalCard.rank,
          },
        ],
      });
    }

    return acc;
  }, [] as Card[]);

  return _.sortBy(allCards, (card) => card.normalCardId);
}
