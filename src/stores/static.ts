import { defineStore } from 'pinia';

import type { Card } from '@/types/cards.types';
import skillCards from '../assets/skill_cards.json';

export const useStaticStore = defineStore('static', {
  state: () => ({
    abilities: skillCards.abilities as Card[],
    talents: skillCards.talents as Card[],
  }),
});

// TODO: use cardId in builds, get spellId from user's known rank for talents (or 1 by default)
