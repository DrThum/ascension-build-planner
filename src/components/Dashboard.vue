<template>
  <div id="spells-and-groups">
    <SpellList title="Abilities" :spells="staticStore.abilities" />
    <SpellList title="Talents" :spells="staticStore.talents" />
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
#spells-and-groups {
  display: flex;
  width: 100%;
}
</style>
