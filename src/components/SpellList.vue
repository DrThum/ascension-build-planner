<template>
  <div class="spell-list">
    <h2>{{ title }}</h2>

    <ul>
      <li v-for="spell in spells">
        {{ spell.spellName }} ({{ spell.spellId }})
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
defineProps({ title: String, spells: Array<{ spellId: number; spellName: string }> })
</script>

<style scoped>
.spell-list {
  flex-grow: 1;
}
</style>
