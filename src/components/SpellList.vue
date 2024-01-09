<template>
  <div class="spell-list">
    <h2>{{ title }}</h2>

    <AutoComplete v-model="search" :suggestions="searchResults" optionLabel="spellName" @complete="performSearch">
      <template #option="slotProps">
        <div class="flex align-options-center">
          <p class="result-title">{{ slotProps.option.spellName }}</p>
          <p class="result-description" style="max-width: 500px;">{{ slotProps.option.description }}</p>
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
import AutoComplete from 'primevue/autocomplete'
import { ref } from 'vue'

const props = defineProps({ title: String, spells: Array<{ spellId: number; spellName: string; description: string }> })

const search = ref('')
const searchResults = ref([] as Array<{ spellId: number; spellName: string }>)

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
