import { defineStore } from 'pinia';

import type { Card, CardQuality } from '@/types/cards.types';
import _ from 'lodash';
import skillCards from '../assets/skill_cards.json';

export const useStaticStore = defineStore('static', {
  state: () => ({
    abilities: buildCardsData(skillCards.abilities),
    talents: buildCardsData(skillCards.talents),
  }),
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

// TODO: use cardId in builds, get spellId from user's known rank for talents (or 1 by default)
