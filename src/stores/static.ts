import { defineStore } from "pinia";

import skillCards from '../assets/skill_cards.json'

export const useStaticStore = defineStore('static', {
  state: () => ({
    abilities: skillCards.SkillCardsExplorerSkillsDB,
    talents: skillCards.SkillCardsExplorerTalentsDB,
  }),
})
