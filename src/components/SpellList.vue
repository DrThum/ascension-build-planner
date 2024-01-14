<template>
  <div class="spell-list-container">
    <h2>{{ title }}</h2>

    <h3>Card slots</h3>

    <ul class="spells-list">
      <li v-for="spell in cardedNormalAsSpells" :class="qualityToCssClass(spell?.quality)">
        <span v-tooltip.left="spell?.description">{{ spell?.spellName }}</span>
      </li>
    </ul>

    <ul class="spells-list">
      <li
        v-for="spell in cardedGoldenAsSpells"
        :class="qualityToCssClass(spell?.quality)"
        class="golden"
      >
        <span v-tooltip.left="spell?.description">{{ spell?.spellName }}</span>
      </li>
    </ul>

    <h3>All {{ title?.toLowerCase() }}</h3>
    <AutoComplete
      v-model="search"
      :suggestions="searchResults"
      optionLabel="spellName"
      @complete="performSearch"
      @item-select="spellSelected"
      scrollHeight="500px"
      :placeholder="`Search ${props.title}`"
    >
      <template #option="slotProps">
        <div class="flex align-options-center">
          <p class="result-title">{{ slotProps.option.spellName }}</p>
          <p class="result-description" style="max-width: 500px; white-space: normal">
            {{ slotProps.option.description }}
          </p>
        </div>
      </template>
    </AutoComplete>

    <ul class="spells-list">
      <li v-for="spell in spells" :class="qualityToCssClass(spell?.quality)">
        <span v-tooltip.left="spell?.description">{{ spell?.spellName }}</span>
        <div>
          <Button
            icon="pi pi-credit-card"
            severity="secondary"
            text
            rounded
            @click="toggleMenu(spell?.spellId, $event)"
          />
          <Menu
            :ref="(el) => (slotCardMenuRefs[spell!.spellId] = el)"
            :model="[
              { label: 'Slot as normal', command: () => slotCard(spell!.spellId, false) },
              { label: 'Slot as golden', command: () => slotCard(spell!.spellId, true) },
            ]"
            :popup="true"
          />
          <Button
            icon="pi pi-trash"
            role="remove-spell"
            severity="secondary"
            text
            rounded
            @click="removeSpell(spell?.spellId)"
          />
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import type { Spell } from '../types/cards.types';
import AutoComplete, { type AutoCompleteItemSelectEvent } from 'primevue/autocomplete';
import Button from 'primevue/button';
import Menu from 'primevue/menu';
import { useStaticStore } from '@/stores/static';
import { computed, ref, defineModel, type ModelRef } from 'vue';

import { CardFamily } from '@/types/cards.types';

const staticStore = useStaticStore();

const spellIds: ModelRef<Number[] | undefined, string> = defineModel();
const cardedNormal = defineModel('cardSlotsNormal');
const cardedGolden = defineModel('cardSlotsGolden');

const slotCardMenuRefs = ref({});

const props = defineProps({ title: String, type: CardFamily });

const search = ref('');
const searchResults = ref([] as Array<Spell>);

const source = _.uniqBy(
  props.type === 'abilities' ? staticStore.abilities : staticStore.talents,
  (s) => s.cardId,
);

function performSearch() {
  searchResults.value = source.filter((spellId) => {
    const spellAlreadyChosen = spells.value.includes(spellId);
    const spellNameOrDescriptionMatches = `${spellId.spellName} ${spellId.description}`
      .toLowerCase()
      .includes(search.value.toLowerCase());

    return !spellAlreadyChosen && spellNameOrDescriptionMatches;
  });
}

const spells = computed(() => {
  const source = props.type === 'abilities' ? staticStore.abilities : staticStore.talents;

  // TODO: Move the ability to get a spell by ID to the static store
  return spellIds
    .value!.map((spellId) => source.find((sourceSpell) => sourceSpell.spellId === spellId))
    .filter((spell) => spell !== undefined);
});

const cardedNormalAsSpells = computed(() => {
  const source = props.type === 'abilities' ? staticStore.abilities : staticStore.talents;

  return cardedNormal
    .value!.map((spellId) => source.find((sourceSpell) => sourceSpell.spellId === spellId))
    .filter((spell) => spell !== undefined);
});

const cardedGoldenAsSpells = computed(() => {
  const source = props.type === 'abilities' ? staticStore.abilities : staticStore.talents;

  return cardedGolden
    .value!.map((spellId) => source.find((sourceSpell) => sourceSpell.spellId === spellId))
    .filter((spell) => spell !== undefined);
});

function spellSelected(ev: AutoCompleteItemSelectEvent) {
  spellIds.value!.push(ev.value.spellId);
  search.value = '';
}

function qualityToCssClass(quality?: string) {
  switch (quality) {
    case 'SKILL_CARD_POOR':
      return 'quality-poor';
    case 'SKILL_CARD_COMMON':
      return 'quality-common';
    case 'SKILL_CARD_UNCOMMON':
      return 'quality-uncommon';
    case 'SKILL_CARD_RARE':
      return 'quality-rare';
    case 'SKILL_CARD_EPIC':
      return 'quality-epic';
    case 'SKILL_CARD_LEGENDARY':
      return 'quality-legendary';
    default:
      return '';
  }
}

function removeSpell(removedSpellId?: Number) {
  if (removedSpellId) {
    const index = spellIds.value!.indexOf(removedSpellId);
    spellIds.value!.splice(index, 1);
  }
}

function toggleMenu(spellId: number, event: Event) {
  slotCardMenuRefs.value[spellId!].toggle(event);
}

function slotCard(spellId?: number, isGolden: boolean) {
  if (isGolden) {
    if (cardedGolden.value.includes(spellId)) {
      const index = cardedGolden.value.indexOf(spellId);
      cardedGolden.value.splice(index, 1);
    } else {
      cardedGolden.value.push(spellId!);
    }
  } else {
    if (cardedNormal.value.includes(spellId)) {
      const index = cardedNormal.value.indexOf(spellId);
      cardedNormal.value.splice(index, 1);
    } else {
      cardedNormal.value.push(spellId!);
    }
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

ul.spells-list li.golden {
  color: #ede944;
}

/*ul.spells-list li button[role="remove-spell"] {
  visibility: hidden;
}

ul.spells-list li:hover button[role="remove-spell"] {
  visibility: visible;
}*/
</style>
