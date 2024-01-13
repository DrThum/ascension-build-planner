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
import { useStaticStore } from '@/stores/static'
import { computed, ref, type Ref } from 'vue'

const staticStore = useStaticStore()

const props = defineProps({ title: String, spellIds: Array<Number>, type: String /* TODO enum */ })

const search = ref('')
const searchResults = ref([] as Array<Spell>)

function performSearch() {
  const source = props.type === 'abilities' ? staticStore.abilities : staticStore.talents;

  searchResults.value = source.filter((spellId) => {
    return `${spellId.spellName} ${spellId.description}`.toLowerCase().includes(search.value.toLowerCase())
  });
}

const spells = computed(() => {
  const source = props.type === 'abilities' ? staticStore.abilities : staticStore.talents;

  return props.spellIds!.map((spellId) => source.find((sourceSpell) => sourceSpell.spellId === spellId)).filter((spell) => spell !== undefined);
})
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
