<template>
  <div class="spell-list">
    <h2>{{ title }}</h2>

    <AutoComplete v-model="search" :suggestions="searchResults" optionLabel="spellName" @complete="performSearch"
      scrollHeight="500px">
      <template #option="slotProps">
        <div class="flex align-options-center">
          <p class="result-title">{{ slotProps.option.spellName }}</p>
          <p class="result-description" style="max-width: 500px; white-space: normal;">
            {{ slotProps.option.description }}
          </p>
        </div>
      </template>
    </AutoComplete>

    <ul>
      <li v-for="spell in spells">
        {{ spell.spellName }} ({{ spell.spellId }})
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Spell } from '../types/cards.types'
import AutoComplete from 'primevue/autocomplete'
import { ref } from 'vue'

const props = defineProps({ title: String, spells: Array<Spell> })

const search = ref('')
const searchResults = ref([] as Array<Spell>)

function performSearch() {
  searchResults.value = props.spells!.filter((spell) => {
    return `${spell.spellName} ${spell.description}`.toLowerCase().includes(search.value.toLowerCase())
  });
}
</script>

<style>
.spell-list {
  flex-grow: 1;
}

.p-autocomplete .p-autocomplete-input {
  width: 95%;
}

.result-title {
  font-weight: bold;
}
</style>
