<template>
  <div class="card-list-container">
    <h2>{{ title }}</h2>

    <h3>Card slots</h3>

    <ul class="cards-list">
      <li v-for="card in cardedNormal" :class="qualityToCssClass(card.quality)">
        <span
          v-tooltip.left="
            cardsStore.spellForCard(card.normalCardId, cardCategory, false).description
          "
          >{{ card.spells[0].name }} (<span
            :class="{ 'not-collected': cardsStore.collectedRank(card.normalCardId, false) === 0 }"
          >
            {{ cardsStore.collectedRank(card.normalCardId, false) }}/{{ card.maxRank }} </span
          >)</span
        >
      </li>
      <li v-for="_i in new Array(Math.max(cardSlotCount - cardedNormal.length, 0))">
        <span class="empty-card-slot">&lt;empty slot&gt;</span>
      </li>
    </ul>

    <ul class="cards-list">
      <li v-for="card in cardedGolden" :class="qualityToCssClass(card.quality)" class="golden">
        <span
          v-tooltip.left="
            cardsStore.spellForCard(card.goldenCardId, cardCategory, true).description
          "
        >
          {{ card.spells[0].name }}
          (<span
            :class="{ 'not-collected': cardsStore.collectedRank(card.goldenCardId, true) === 0 }"
          >
            {{ cardsStore.collectedRank(card.goldenCardId, true) }}/{{ card.maxRank }} </span
          >)
        </span>
      </li>
      <li v-for="_i in new Array(Math.max(cardSlotCount - cardedGolden.length, 0))" class="golden">
        <span class="empty-card-slot">&lt;empty slot&gt;</span>
      </li>
    </ul>

    <h3>All {{ title.toLowerCase() }} ({{ cardIds.length }}/{{ maxCardCount }})</h3>
    <div class="search-sort-cards-container">
      <AutoComplete
        v-model="search"
        :suggestions="searchResults"
        @complete="performSearch"
        @item-select="cardSelected"
        scrollHeight="500px"
        :placeholder="`Add ${props.title}...`"
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

      <InputText type="text" v-model="currentFilter" placeholder="Filter cards..." />
    </div>

    <ul class="cards-list">
      <li v-for="card in cards" :class="qualityToCssClass(card.quality)">
        <span
          v-tooltip.left="
            cardsStore.spellForCard(card.normalCardId, cardCategory, false, card.maxRank)
              .description
          "
          ><span class="card-spell-name">{{ card.spells[0].name }}</span>
          <br />
          <span
            v-if="cardsStore.collectedRank(card.normalCardId, false) > 0"
            class="card-collected-indicator spell-metadata"
            >N</span
          >
          <span
            v-if="cardsStore.collectedRank(card.goldenCardId, true) > 0"
            class="card-collected-indicator golden spell-metadata"
            >G</span
          >
          <span class="required-level spell-metadata">(lvl {{ card.requiredLevel }})</span></span
        >
        <div>
          <Button
            icon="pi pi-credit-card"
            severity="secondary"
            text
            class="p-button-xsm"
            @click="toggleMenu(card, $event)"
          />
          <Menu
            :ref="(el) => (slotCardMenuRefs[card.normalCardId] = el)"
            :model="[
              {
                label: hasCardSlotted(card.normalCardId) ? 'Unslot' : 'Slot as normal',
                class:
                  cardedNormal.length >= cardSlotCount && !hasCardSlotted(card.normalCardId)
                    ? 'slot-disabled'
                    : '',
                icon:
                  (cardsStore.collectedRank(card.normalCardId, false) > 0 &&
                    cardedNormal.length < cardSlotCount) ||
                  hasCardSlotted(card.normalCardId)
                    ? PrimeIcons.CHECK_CIRCLE
                    : PrimeIcons.EXCLAMATION_CIRCLE,
                command: () => slotCard(card, false),
              },
              {
                label: hasCardSlotted(card.goldenCardId) ? 'Unslot' : 'Slot as golden',
                class:
                  cardedGolden.length >= cardSlotCount && !hasCardSlotted(card.goldenCardId)
                    ? 'slot-disabled'
                    : '',
                icon:
                  (cardsStore.collectedRank(card.goldenCardId, true) > 0 &&
                    cardedGolden.length < cardSlotCount) ||
                  hasCardSlotted(card.goldenCardId)
                    ? PrimeIcons.CHECK_CIRCLE
                    : PrimeIcons.EXCLAMATION_CIRCLE,
                command: () => slotCard(card, true),
              },
            ]"
            :popup="true"
          />
          <Button
            icon="pi pi-trash"
            role="remove-spell"
            severity="secondary"
            text
            class="p-button-xsm"
            @click="removeCard(card)"
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
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Menu from 'primevue/menu';
import { useCardsStore } from '@/stores/cards';
import { computed, ref, defineModel, type PropType, type Ref } from 'vue';

import { PrimeIcons } from 'primevue/api';
import { useToast } from 'primevue/usetoast';

import { CardCategory } from '@/types/cards.types';

const cardsStore = useCardsStore();

const cardIds: Ref<number[]> = defineModel({ required: true });
const cardedNormalIds: Ref<number[]> = defineModel('cardSlotsNormal', { required: true });
const cardedGoldenIds: Ref<number[]> = defineModel('cardSlotsGolden', { required: true });

const slotCardMenuRefs = ref({} as { [x: number]: any });

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

const search = ref('');
const searchResults = ref([] as Array<Card>);
const currentFilter = ref('');

const dataSource =
  props.cardCategory === CardCategory.Ability ? cardsStore.all.ability : cardsStore.all.talent;
function performSearch() {
  searchResults.value = dataSource.filter((card) => {
    const cardAlreadyChosen = cardIds.value.includes(card.normalCardId);
    const allSpellNamesAndDescr = card.spells
      .map((spell) => `${spell.name} ${spell.description}`)
      .join('\n');
    const spellNameOrDescriptionMatches = allSpellNamesAndDescr
      .toLowerCase()
      .includes(search.value.toLowerCase());

    return !cardAlreadyChosen && spellNameOrDescriptionMatches;
  });
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

  return _.sortBy(cards, (c) => [qualityRanks[c.quality], c.spells[0].name]);
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

function toggleMenu(card: Card, event: Event) {
  slotCardMenuRefs.value[card.normalCardId].toggle(event);
}

function slotCard(card: Card, isGolden: boolean) {
  if (isGolden) {
    if (cardedGoldenIds.value.includes(card.goldenCardId)) {
      const index = cardedGoldenIds.value.indexOf(card.goldenCardId);
      cardedGoldenIds.value.splice(index, 1);
    } else {
      if (cardedGoldenIds.value.length >= props.cardSlotCount) {
        toast.add({
          severity: 'error',
          summary: 'Too many slotted cards',
          detail: `You already have ${props.cardSlotCount} slotted golden cards`,
          life: 3000,
        });
        return;
      }

      // Remove from normal carded slots, if needed
      const indexInNormal = cardedNormalIds.value.indexOf(card.normalCardId);
      if (indexInNormal > -1) {
        cardedNormalIds.value.splice(indexInNormal, 1);
      }
      cardedGoldenIds.value.push(card.goldenCardId);
    }
  } else {
    if (cardedNormalIds.value.includes(card.normalCardId)) {
      const index = cardedNormalIds.value.indexOf(card.normalCardId);
      cardedNormalIds.value.splice(index, 1);
    } else {
      if (cardedNormalIds.value.length >= props.cardSlotCount) {
        toast.add({
          severity: 'error',
          summary: 'Too many slotted cards',
          detail: `You already have ${props.cardSlotCount} slotted normal cards`,
          life: 3000,
        });
        return;
      }

      // Remove from golden carded slots, if needed
      const indexInGolden = cardedGoldenIds.value.indexOf(card.goldenCardId);
      if (indexInGolden > -1) {
        cardedGoldenIds.value.splice(indexInGolden, 1);
      }
      cardedNormalIds.value.push(card.normalCardId);
    }
  }
}

function hasCardSlotted(cardId: number): boolean {
  return cardedNormalIds.value.includes(cardId) || cardedGoldenIds.value.includes(cardId);
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
</style>
