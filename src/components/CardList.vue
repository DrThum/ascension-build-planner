<template>
  <div class="card-list-container">
    <h2>{{ title }}</h2>

    <h3>Card slots</h3>

    <ul class="cards-list">
      <li
        v-for="card in cardedNormal"
        :key="card.normalCardId"
        :class="qualityToCssClass(card.quality)"
      >
        <CardSlot
          :card="card"
          :category="props.cardCategory"
          :onDelete="() => slotCard(card, currentSlotForCard(card), CardSlotType.None)"
        />
      </li>
      <li v-for="i in new Array(Math.max(cardSlotCount - cardedNormal.length, 0))" :key="i">
        <span class="empty-card-slot">&lt;empty slot&gt;</span>
      </li>
    </ul>

    <ul class="cards-list">
      <li
        v-for="card in cardedGolden"
        :key="card.goldenCardId"
        :class="qualityToCssClass(card.quality)"
        class="golden"
      >
        <CardSlot
          :card="card"
          :category="props.cardCategory"
          :isGoldenSlot="true"
          :onDelete="() => slotCard(card, currentSlotForCard(card), CardSlotType.None)"
        />
      </li>
      <li
        v-for="i in new Array(Math.max(cardSlotCount - cardedGolden.length, 0))"
        :key="i"
        class="golden"
      >
        <span class="empty-card-slot">&lt;empty slot&gt;</span>
      </li>
    </ul>

    <h3>All {{ title.toLowerCase() }} ({{ cardIds.length }}/{{ maxCardCount }})</h3>
    <div class="search-sort-cards-container">
      <AutoComplete
        v-model="search"
        :suggestions="searchResults"
        scroll-height="500px"
        :placeholder="`Add ${props.title}...`"
        @complete="performSearch"
        @item-select="cardSelected"
      >
        <template #option="slotProps">
          <div class="flex align-options-center">
            <p class="result-title">
              {{ cardsStore.spellForCard(slotProps.option.normalCardId, cardCategory, false).name }}
            </p>
            <p class="result-description" style="max-width: 500px; white-space: normal">
              {{
                cardsStore.spellForCard(slotProps.option.normalCardId, cardCategory, false)
                  .description
              }}
            </p>
          </div>
        </template>
      </AutoComplete>

      <div class="sort-filter-cards-container">
        <div class="sort-cards-container">
          <span>Sort by</span>
          <Button
            label="Quality"
            text
            size="small"
            :severity="currentSort === Sort.QUALITY ? 'primary' : 'secondary'"
            @click="sortBy(Sort.QUALITY)"
          />
          <Button
            label="Level"
            text
            size="small"
            :severity="currentSort === Sort.LEVEL ? 'primary' : 'secondary'"
            @click="sortBy(Sort.LEVEL)"
          />
          <Button
            label="Name"
            text
            size="small"
            :severity="currentSort === Sort.NAME ? 'primary' : 'secondary'"
            @click="sortBy(Sort.NAME)"
          />
        </div>
        <InputText v-model="currentFilter" type="text" placeholder="Filter cards..." />
      </div>
    </div>

    <ul class="cards-list">
      <li v-for="card in cards" :key="card.normalCardId" :class="qualityToCssClass(card.quality)">
        <CardListCard
          :card="card"
          :category="props.cardCategory"
          :current-slot="currentSlotForCard(card)"
          :has-free-starting-slots="(startingCardIds?.length ?? 0) < 4"
          :has-free-normal-slots="cardedNormalIds.length < props.cardSlotCount"
          :has-free-golden-slots="cardedGoldenIds.length < props.cardSlotCount"
          :onDelete="() => removeCard(card)"
          :slotCard="slotCard"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { CardQuality, type Card } from '../types/cards.types';
import AutoComplete, { type AutoCompleteItemSelectEvent } from 'primevue/autocomplete';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useCardsStore } from '@/stores/cards';
import { computed, ref, defineModel, type PropType, type Ref } from 'vue';
import CardSlot from './card/CardSlot.vue';
import CardListCard from './card/CardListCard.vue';

import { useToast } from 'primevue/usetoast';

import { CardCategory, CardSlotType } from '@/types/cards.types';

const cardsStore = useCardsStore();

const cardIds: Ref<number[]> = defineModel({ required: true });
const cardedNormalIds: Ref<number[]> = defineModel('cardSlotsNormal', { required: true });
const cardedGoldenIds: Ref<number[]> = defineModel('cardSlotsGolden', { required: true });
const startingCardIds: Ref<number[] | undefined> = defineModel('startingCardIds', {
  required: false,
});

const toast = useToast();

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  cardCategory: {
    type: String as PropType<CardCategory>,
    required: true,
  },
  maxCardCount: {
    type: Number,
    required: true,
  },
  cardSlotCount: {
    type: Number,
    required: true,
  },
});

enum Sort {
  QUALITY = 'quality',
  LEVEL = 'level',
  NAME = 'name',
}

enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

const search = ref('');
const searchResults = ref([] as Array<Card>);
const currentFilter = ref('');
const currentSort = ref(Sort.QUALITY);
const currentSortDirection = ref(SortDirection.ASC);

const dataSource =
  props.cardCategory === CardCategory.Ability ? cardsStore.all.ability : cardsStore.all.talent;
function performSearch() {
  const spellNameMatching = dataSource.filter((card) => {
    const cardAlreadyChosen = cardIds.value.includes(card.normalCardId);
    const spellNameOrDescriptionMatches = card.spells[0].name
      .toLowerCase()
      .includes(search.value.toLowerCase());

    return !cardAlreadyChosen && spellNameOrDescriptionMatches;
  });

  const spellDescriptionMatching = dataSource.filter((card) => {
    const cardAlreadyChosen = cardIds.value.includes(card.normalCardId);
    const allSpellDescr = card.spells.map((spell) => `${spell.description}`).join('\n');
    const spellDescriptionMatches = allSpellDescr
      .toLowerCase()
      .includes(search.value.toLowerCase());

    return !cardAlreadyChosen && spellDescriptionMatches;
  });

  searchResults.value = _.uniqBy(
    spellNameMatching.concat(spellDescriptionMatching),
    'normalCardId',
  );
}

const qualityRanks = {
  [CardQuality.Common]: 4,
  [CardQuality.Uncommon]: 3,
  [CardQuality.Rare]: 2,
  [CardQuality.Epic]: 1,
  [CardQuality.Legendary]: 0,
};

const cards = computed(() => {
  const cards = cardIds.value
    .map((cardId) => dataSource.find((sourceCard) => sourceCard.normalCardId === cardId))
    .filter(
      (card) =>
        card !== undefined &&
        card.spells[0].name.toLowerCase().includes(currentFilter.value.toLowerCase()),
    ) as Card[];

  if (currentSort.value === Sort.QUALITY) {
    return _.orderBy(
      cards,
      [(c) => qualityRanks[c.quality], 'spells[0].name'],
      [currentSortDirection.value, SortDirection.ASC],
    );
  }

  if (currentSort.value === Sort.LEVEL) {
    return _.orderBy(
      cards,
      ['requiredLevel', 'spells[0].name'],
      [currentSortDirection.value, SortDirection.ASC],
    );
  }

  if (currentSort.value === Sort.NAME) {
    return _.orderBy(cards, ['spells[0].name'], [currentSortDirection.value]);
  }

  return cards;
});

const cardedNormal = computed(() => {
  return cardedNormalIds.value
    .map((cardId) => dataSource.find((sourceCard) => sourceCard.normalCardId === cardId))
    .filter((card) => card !== undefined) as Card[];
});

const cardedGolden = computed(() => {
  return cardedGoldenIds.value
    .map((cardId) => dataSource.find((sourceCard) => sourceCard.goldenCardId === cardId))
    .filter((card) => card !== undefined) as Card[];
});

function cardSelected(ev: AutoCompleteItemSelectEvent) {
  cardIds.value.push(ev.value.normalCardId);
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

function removeCard(removedCard: Card) {
  // Remove from the carded slots
  const indexInNormal = cardedNormalIds.value.indexOf(removedCard.normalCardId);
  if (indexInNormal > -1) {
    cardedNormalIds.value.splice(indexInNormal, 1);
  }
  const indexInGolden = cardedGoldenIds.value.indexOf(removedCard.goldenCardId);
  if (indexInGolden > -1) {
    cardedGoldenIds.value.splice(indexInGolden, 1);
  }

  const index = cardIds.value.indexOf(removedCard.normalCardId);
  cardIds.value.splice(index, 1);
}

function sortBy(sort: Sort) {
  if (currentSort.value === sort) {
    currentSortDirection.value =
      currentSortDirection.value === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC;
    return;
  }

  currentSort.value = sort;
  currentSortDirection.value = SortDirection.ASC;
}

function slotCard(card: Card, prevSlot: CardSlotType, newSlot: CardSlotType) {
  if (prevSlot !== newSlot) {
    let canSlot = true;
    let maxSlotted = 4;
    if (newSlot === CardSlotType.Normal && cardedNormalIds.value.length >= props.cardSlotCount) {
      canSlot = false;
      maxSlotted = props.cardSlotCount;
    } else if (
      newSlot === CardSlotType.Golden &&
      cardedGoldenIds.value.length >= props.cardSlotCount
    ) {
      canSlot = false;
      maxSlotted = props.cardSlotCount;
    } else if (newSlot === CardSlotType.Starting && (startingCardIds.value?.length ?? 0) >= 4) {
      canSlot = false;
      maxSlotted = 4;
    }

    if (!canSlot) {
      toast.add({
        severity: 'error',
        summary: 'Too many slotted cards',
        detail: `You already have ${maxSlotted} cards in that slot`,
        life: 3000,
      });
      return;
    }
  }

  switch (prevSlot) {
    case CardSlotType.Normal: {
      const index = cardedNormalIds.value.indexOf(card.normalCardId);
      cardedNormalIds.value.splice(index, 1);
      break;
    }
    case CardSlotType.Golden: {
      const index = cardedGoldenIds.value.indexOf(card.goldenCardId);
      cardedGoldenIds.value.splice(index, 1);
      break;
    }
    case CardSlotType.Starting: {
      if (startingCardIds.value !== undefined) {
        const index = startingCardIds.value.indexOf(card.normalCardId);
        startingCardIds.value.splice(index, 1);
        break;
      }
    }
    default:
      break;
  }

  if (prevSlot === newSlot) {
    return;
  }

  switch (newSlot) {
    case CardSlotType.Normal: {
      cardedNormalIds.value.push(card.normalCardId);
      break;
    }
    case CardSlotType.Golden: {
      cardedGoldenIds.value.push(card.goldenCardId);
      break;
    }
    case CardSlotType.Starting: {
      startingCardIds.value !== undefined
        ? startingCardIds.value.push(card.normalCardId)
        : (startingCardIds.value = [card.normalCardId]);
      break;
    }
    default:
      break;
  }
}

function currentSlotForCard(card: Card): CardSlotType {
  if (cardedNormalIds.value.includes(card.normalCardId)) {
    return CardSlotType.Normal;
  }

  if (cardedGoldenIds.value.includes(card.goldenCardId)) {
    return CardSlotType.Golden;
  }

  if (startingCardIds.value?.includes(card.normalCardId)) {
    return CardSlotType.Starting;
  }

  return CardSlotType.None;
}
</script>

<style>
.card-list-container {
  flex-grow: 1;
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
  box-shadow: 0px 0px 15px 1px rgba(255, 234, 43, 1);
}

ul.cards-list .not-collected {
  color: red;
}

.spell-metadata {
  line-height: 1.7em;
}

.required-level {
  opacity: 60%;
}

.card-collected-indicator {
  margin-right: 5px;
  border: solid 2px;
  padding: 0 3px;
  border-radius: 3px;
}

.card-collected-indicator.golden {
  color: rgba(255, 234, 43, 1);
}

.card-spell-name {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.p-button-xsm {
  padding: 0;
  width: 30px;
}

.empty-card-slot {
  font-style: italic;
  opacity: 60%;
}

.slot-disabled,
.slot-disabled span {
  color: red;
}

.search-sort-cards-container {
  display: flex;
  justify-content: space-between;
  margin-right: 5px;
}
.sort-filter-cards-container {
  display: flex;
  align-items: center;
}

.sort-cards-container {
  font-weight: bold;
  margin-right: 5px;
  display: flex;
  align-items: center;
}

.sort-cards-container > span:first-child {
  height: 45px;
  line-height: 40px;
}
</style>
