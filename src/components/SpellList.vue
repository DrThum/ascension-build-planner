<template>
  <div class="spell-list-container">
    <h2>{{ title }}</h2>

    <AutoComplete v-model="search" :suggestions="searchResults" optionLabel="spellName" @complete="performSearch"
      @item-select="spellSelected" scrollHeight="500px" :placeholder="`Search ${props.title}`">
      <template #option="slotProps">
        <div class="flex align-options-center">
          <p class="result-title">{{ slotProps.option.spellName }}</p>
          <p class="result-description" style="max-width: 500px; white-space: normal;">
            {{ slotProps.option.description }}
          </p>
        </div>
      </template>
    </AutoComplete>

    <ul class="spells-list">
      <li v-for="spell in spells">
        {{ spell.spellName }}
        <Button icon="pi pi-trash" severity="danger" text rounded />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import type { Spell } from '../types/cards.types'
import AutoComplete, { type AutoCompleteItemSelectEvent } from 'primevue/autocomplete'
import Button from 'primevue/button'
import { useStaticStore } from '@/stores/static'
import { computed, ref, defineModel, type ModelRef } from 'vue'

const staticStore = useStaticStore()

const spellIds: ModelRef<Number[] | undefined, string> = defineModel();

const props = defineProps({ title: String, type: String /* TODO enum */ })

const search = ref('')
const searchResults = ref([] as Array<Spell>)

const source = _.uniqBy(props.type === 'abilities' ? staticStore.abilities : staticStore.talents, s => s.cardId);

function performSearch() {
  searchResults.value = source.filter((spellId) => {
    const spellAlreadyChosen = spells.value.includes(spellId);
    const spellNameOrDescriptionMatches = `${spellId.spellName} ${spellId.description}`.toLowerCase().includes(search.value.toLowerCase());

    return !spellAlreadyChosen && spellNameOrDescriptionMatches;
  });
}

const spells = computed(() => {
  const source = props.type === 'abilities' ? staticStore.abilities : staticStore.talents;

  return spellIds.value!.map((spellId) => source.find((sourceSpell) => sourceSpell.spellId === spellId)).filter((spell) => spell !== undefined);
})

function spellSelected(ev: AutoCompleteItemSelectEvent) {
  spellIds.value!.push(ev.value.spellId);
  search.value = '';
};
</script>

<style>
.spell-list-container {
  flex-grow: 1;
  margin-right: 10px;
}

.p-autocomplete .p-autocomplete-input {
  width: 95%;
}

.result-title {
  font-weight: bold;
}

ul.spells-list {
  padding-left: 0;
}

ul.spells-list li {
  border: solid 1px lightgrey;
  border-radius: 8px;
  margin: 8px 0;
  padding: 10px;
  list-style: none;

  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
