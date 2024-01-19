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
  abilityNormal: Card[];
  abilityGolden: Card[];
  talentNormal: Card[];
  talentGolden: Card[];
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
      abilityNormal: buildCardsData(abilityNormal),
      abilityGolden: buildCardsData(abilityGolden),
      talentNormal: buildCardsData(talentNormal),
      talentGolden: buildCardsData(talentGolden),
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
            relevantCardCatalog = state.all.abilityGolden;
          } else {
            relevantCollectedCards = state.collection.abilityNormal;
            relevantCardCatalog = state.all.abilityNormal;
          }
        } else {
          if (isGolden) {
            relevantCollectedCards = state.collection.talentGolden;
            relevantCardCatalog = state.all.talentGolden;
          } else {
            relevantCollectedCards = state.collection.talentNormal;
            relevantCardCatalog = state.all.talentNormal;
          }
        }

        const rankToFind =
          overrideRank ?? relevantCollectedCards.find((c) => c.cardId === cardId)?.rank ?? 1;

        const card = relevantCardCatalog.find((a) => a.cardId === cardId);
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
