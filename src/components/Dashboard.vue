<template>
  <div id="skills-and-groups">
    <div id="skills">
      <div class="lists">
        <SpellList title="Abilities" :spells="staticStore.abilities" />
        <SpellList title="Talents" :spells="staticStore.talents" />
      </div>
    </div>
    <SpellGroupList />
  </div>
</template>

<script setup lang="ts">
import SpellGroupList from './SpellGroupList.vue'
import SpellList from './SpellList.vue'

import { useStaticStore } from '@/stores/static'

const staticStore = useStaticStore()
</script>

<style scoped>
#skills-and-groups {
  display: flex;
  width: 100%;
}

#skills {
  display: flex;
  flex-direction: column;
  flex-grow: 2;
}

#skills>div.lists {
  display: flex;
  flex-grow: 1;
}

#skills>div.search-container input {
  min-width: 500px;
}
</style>
