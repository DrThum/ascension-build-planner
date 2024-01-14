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
      <li v-for="spell in spells" :class="qualityToCssClass(spell?.quality)">
        <span v-tooltip.left="spell?.description">{{ spell?.spellName }}</span>
        <Button icon="pi pi-trash" role="remove-spell" severity="secondary" text rounded
          @click="removeSpell(spell?.spellId)" />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import _, { remove } from 'lodash';
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

function qualityToCssClass(quality?: string) {
  switch (quality) {
    case "SKILL_CARD_POOR": return 'quality-poor';
    case "SKILL_CARD_COMMON": return 'quality-common';
    case "SKILL_CARD_UNCOMMON": return 'quality-uncommon';
    case "SKILL_CARD_RARE": return 'quality-rare';
    case "SKILL_CARD_EPIC": return 'quality-epic';
    case "SKILL_CARD_LEGENDARY": return 'quality-legendary';
    default: return '';
  }
}

function removeSpell(removedSpellId?: Number) {
  if (removedSpellId) {
    const index = spellIds.value!.indexOf(removedSpellId);
    spellIds.value!.splice(index, 1);
  }
}
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
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

ul.spells-list li {
  border: solid 2px lightgrey;
  border-radius: 8px;
  margin: 8px 5px 8px 0;
  padding: 5px;
  list-style: none;

  display: flex;
  justify-content: space-between;
  align-items: center;

  font-weight: bold;
}

ul.spells-list li.quality-poor {
  border-color: #9d9d9d;
}

ul.spells-list li.quality-common {
  border-color: #ffffff;
}

ul.spells-list li.quality-uncommon {
  border-color: #1eff00;
}

ul.spells-list li.quality-rare {
  border-color: #0070dd;
}

ul.spells-list li.quality-epic {
  border-color: #a335ee;
}

ul.spells-list li.quality-legendary {
  border-color: #ff8000;
}

ul.spells-list li button[role="remove-spell"] {
  visibility: hidden;
}

ul.spells-list li:hover button[role="remove-spell"] {
  visibility: visible;
}
</style>
