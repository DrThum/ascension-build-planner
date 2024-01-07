<template>
  <h1>WoW Ascension Build Planner</h1>

  <div id="spells-and-groups">
    <SpellList title="Abilities" :spells="abilities" />
    <SpellList title="Talents" :spells="talents" />
    <SpellGroupList />
  </div>
</template>

<script setup lang="ts">
import SpellGroupList from './SpellGroupList.vue'
import SpellList from './SpellList.vue'

import skillCards from '../assets/skill_cards.json'

const abilities = skillCards.SkillCardsExplorerSkillsDB;
const talents = skillCards.SkillCardsExplorerTalentsDB;
</script>

<style scoped>
#spells-and-groups {
  display: flex;
  width: 100%;
}
</style>
