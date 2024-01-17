<template>
  <div class="card-list-container">
    <h2>{{ title }}</h2>

    <h3>Card slots</h3>

    <ul class="cards-list">
      <li v-for="card in cardedNormalAsSpells" :class="qualityToCssClass(card.quality)">
        <span v-tooltip.left="card.spells[0].description">{{ card.spells[0].name }}</span
        ><!-- FIXME: use appropriate spell rank here -->
      </li>
    </ul>

    <ul class="cards-list">
      <li
        v-for="card in cardedGoldenAsSpells"
        :class="qualityToCssClass(card.quality)"
        class="golden"
      >
        <span v-tooltip.left="card.spells[0].description">{{ card.spells[0].name }}</span
        ><!-- FIXME: use appropriate spell rank here -->
      </li>
    </ul>

    <h3>All {{ title.toLowerCase() }}</h3>
    <AutoComplete
      v-model="search"
      :suggestions="searchResults"
      optionLabel="FIXME"
      @complete="performSearch"
      @item-select="cardSelected"
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

    <ul class="cards-list">
      <li v-for="card in cards" :class="qualityToCssClass(card.quality)">
        <span v-tooltip.left="card.spells[0].description">{{ card.spells[0].name }}</span>
        <!-- FIXME: use appropriate spell rank here -->
        <div>
          <Button
            icon="pi pi-credit-card"
            severity="secondary"
            text
            rounded
            @click="toggleMenu(card.cardId, $event)"
          />
          <Menu
            :ref="(el) => (slotCardMenuRefs[card.cardId] = el)"
            :model="[
              { label: 'Slot as normal', command: () => slotCard(card.cardId, false) },
              { label: 'Slot as golden', command: () => slotCard(card.cardId, true) },
            ]"
            :popup="true"
          />
          <Button
            icon="pi pi-trash"
            role="remove-spell"
            severity="secondary"
            text
            rounded
            @click="removeSpell(card.cardId)"
          />
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { CardQuality, type Card } from '../types/cards.types';
import AutoComplete, { type AutoCompleteItemSelectEvent } from 'primevue/autocomplete';
import Button from 'primevue/button';
import Menu from 'primevue/menu';
import { useStaticStore } from '@/stores/static';
import { computed, ref, defineModel, type PropType, type Ref } from 'vue';

import { CardCategory } from '@/types/cards.types';

const staticStore = useStaticStore();

const cardIds: Ref<number[]> = defineModel({ required: true });
const cardedNormalIds: Ref<number[]> = defineModel('cardSlotsNormal', { required: true });
const cardedGoldenIds: Ref<number[]> = defineModel('cardSlotsGolden', { required: true });

const slotCardMenuRefs = ref({} as { [x: number]: any });

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  cardCategory: {
    type: String as PropType<CardCategory>,
    required: true,
  },
});

const search = ref('');
const searchResults = ref([] as Array<Card>);

const dataSource =
  props.cardCategory === CardCategory.Ability ? staticStore.abilities : staticStore.talents;

function performSearch() {
  searchResults.value = dataSource.filter((card) => {
    const cardAlreadyChosen = cards.value.find((c) => c.cardId) !== undefined;
    const allSpellNamesAndDescr = card.spells
      .map((spell) => `${spell.name} ${spell.description}`)
      .join('\n');
    const spellNameOrDescriptionMatches = allSpellNamesAndDescr
      .toLowerCase()
      .includes(search.value.toLowerCase());

    return !cardAlreadyChosen && spellNameOrDescriptionMatches;
  });
}

const cards = computed(() => {
  // TODO: Move the ability to get a spell by ID to the static store
  return cardIds
    .value!.map((cardId) => dataSource.find((sourceCard) => sourceCard.cardId === cardId))
    .filter((card) => card !== undefined) as Card[];
});

const cardedNormalAsSpells = computed(() => {
  return cardedNormalIds
    .value!.map((cardId) => dataSource.find((sourceCard) => sourceCard.cardId === cardId))
    .filter((spell) => spell !== undefined) as Card[];
});

const cardedGoldenAsSpells = computed(() => {
  return cardedGoldenIds
    .value!.map((cardId) => dataSource.find((sourceCard) => sourceCard.cardId === cardId))
    .filter((spell) => spell !== undefined) as Card[];
});

function cardSelected(ev: AutoCompleteItemSelectEvent) {
  cardIds.value!.push(ev.value.cardId);
  search.value = '';
}

function qualityToCssClass(quality: CardQuality) {
  switch (quality) {
    case CardQuality.Common:
      return 'quality-common';
    case CardQuality.Uncommon:
      return 'quality-uncommon';
    case CardQuality.Rare:
      return 'quality-rare';
    case CardQuality.Epic:
      return 'quality-epic';
    case CardQuality.Legendary:
      return 'quality-legendary';
    default:
      throw new Error(`unexpected card quality ${quality}`);
  }
}

function removeSpell(removedSpellId?: number) {
  if (removedSpellId) {
    const index = cardIds.value!.indexOf(removedSpellId);
    cardIds.value!.splice(index, 1);
  }
}

function toggleMenu(spellId: number, event: Event) {
  slotCardMenuRefs.value[spellId!].toggle(event);
}

function slotCard(spellId: number, isGolden: boolean) {
  if (isGolden) {
    if (cardedGoldenIds.value.includes(spellId)) {
      const index = cardedGoldenIds.value.indexOf(spellId);
      cardedGoldenIds.value.splice(index, 1);
    } else {
      cardedGoldenIds.value.push(spellId!);
    }
  } else {
    if (cardedNormalIds.value.includes(spellId)) {
      const index = cardedNormalIds.value.indexOf(spellId);
      cardedNormalIds.value.splice(index, 1);
    } else {
      cardedNormalIds.value.push(spellId!);
    }
  }
}
</script>

<style>
.card-list-container {
  flex-grow: 1;
  margin-right: 10px;
}

.p-autocomplete .p-autocomplete-input {
  width: 95%;
}

.result-title {
  font-weight: bold;
}

ul.cards-list {
  padding-left: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

ul.cards-list li {
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

ul.cards-list li.quality-common {
  border-color: #ffffff;
}

ul.cards-list li.quality-uncommon {
  border-color: #1eff00;
}

ul.cards-list li.quality-rare {
  border-color: #0070dd;
}

ul.cards-list li.quality-epic {
  border-color: #a335ee;
}

ul.cards-list li.quality-legendary {
  border-color: #ff8000;
}

ul.cards-list li.golden {
  color: #ede944;
}
</style>