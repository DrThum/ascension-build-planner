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
        {{ spell.spellName }}
        <Button icon="pi pi-trash" severity="secondary" text rounded />
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

function qualityToCssClass(quality: string) {
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
</style>
