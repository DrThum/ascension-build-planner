<template>
  <div class="card-list-container">
    <h2>{{ title }}</h2>

    <h3>Card slots</h3>

    <ul class="cards-list">
      <li v-for="card in cardedNormal" :class="qualityToCssClass(card.quality)">
        <span v-tooltip.left="cardsStore.spellForCard(card.cardId, cardCategory, false).description"
          >{{ card.spells[0].name }} (<span
            :class="{ 'not-collected': cardsStore.collectedRank(card.cardId, false) === 0 }"
          >
            {{ cardsStore.collectedRank(card.cardId, false) }}/{{ card.maxRank }} </span
          >)</span
        >
      </li>
    </ul>

    <ul class="cards-list">
      <li v-for="card in cardedGolden" :class="qualityToCssClass(card.quality)" class="golden">
        <span v-tooltip.left="cardsStore.spellForCard(card.cardId, cardCategory, true).description">
          {{ card.spells[0].name }}
          (<span :class="{ 'not-collected': cardsStore.collectedRank(card.cardId, true) === 0 }">
            {{ cardsStore.collectedRank(card.cardId, true) }}/{{ card.maxRank }} </span
          >)
        </span>
      </li>
    </ul>

    <h3>All {{ title.toLowerCase() }} ({{ cardIds.length }}/{{ threshold }})</h3>
    <AutoComplete
      v-model="search"
      :suggestions="searchResults"
      @complete="performSearch"
      @item-select="cardSelected"
      scrollHeight="500px"
      :placeholder="`Search ${props.title}`"
    >
      <template #option="slotProps">
        <div class="flex align-options-center">
          <p class="result-title">
            {{ cardsStore.spellForCard(slotProps.option.cardId, cardCategory, false).name }}
          </p>
          <p class="result-description" style="max-width: 500px; white-space: normal">
            {{ cardsStore.spellForCard(slotProps.option.cardId, cardCategory, false).description }}
          </p>
        </div>
      </template>
    </AutoComplete>

    <ul class="cards-list">
      <li v-for="card in cards" :class="qualityToCssClass(card.quality)">
        <span
          v-tooltip.left="cardsStore.spellForCard(card.cardId, cardCategory, false, card.maxRank)"
          >{{ card.spells[0].name }}</span
        >
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
            @click="removeCard(card.cardId)"
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
import { useCardsStore } from '@/stores/cards';
import { computed, ref, defineModel, type PropType, type Ref } from 'vue';

import { CardCategory } from '@/types/cards.types';

const cardsStore = useCardsStore();

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
  threshold: {
    type: Number,
    required: true,
  },
});

const search = ref('');
const searchResults = ref([] as Array<Card>);

const dataSource = {
  normal:
    props.cardCategory === CardCategory.Ability
      ? cardsStore.all.abilityNormal
      : cardsStore.all.talentNormal,
  golden:
    props.cardCategory === CardCategory.Ability
      ? cardsStore.all.abilityGolden
      : cardsStore.all.talentGolden,
};

function performSearch() {
  searchResults.value = dataSource.normal.filter((card) => {
    const cardAlreadyChosen = cardIds.value.includes(card.cardId);
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
  return cardIds.value
    .map((cardId) => dataSource.normal.find((sourceCard) => sourceCard.cardId === cardId))
    .filter((card) => card !== undefined) as Card[];
});

const cardedNormal = computed(() => {
  return cardedNormalIds
    .value!.map((cardId) => dataSource.normal.find((sourceCard) => sourceCard.cardId === cardId))
    .filter((card) => card !== undefined) as Card[];
});

const cardedGolden = computed(() => {
  return cardedGoldenIds
    .value!.map((cardId) => {
      console.log(
        'cardId',
        cardId,
        dataSource.golden.find((sourceCard) => {
          // console.log('sourceCard', sourceCard);
          return sourceCard.cardId === cardId;
        }),
        dataSource.golden[0],
      );
      return dataSource.golden.find((sourceCard) => sourceCard.cardId === cardId);
    })
    .filter((card) => card !== undefined) as Card[];
});

function cardSelected(ev: AutoCompleteItemSelectEvent) {
  cardIds.value.push(ev.value.cardId);
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

function removeCard(removedCardId: number) {
  // Remove from the carded slots
  const indexInNormal = cardedNormalIds.value.indexOf(removedCardId);
  if (indexInNormal > -1) {
    cardedNormalIds.value.splice(indexInNormal, 1);
  }
  const indexInGolden = cardedGoldenIds.value.indexOf(removedCardId);
  if (indexInGolden > -1) {
    cardedGoldenIds.value.splice(indexInGolden, 1);
  }

  const index = cardIds.value.indexOf(removedCardId);
  cardIds.value.splice(index, 1);
}

function toggleMenu(cardId: number, event: Event) {
  slotCardMenuRefs.value[cardId].toggle(event);
}

function slotCard(normalCardId: number, isGolden: boolean) {
  if (isGolden) {
    if (cardedGoldenIds.value.includes(normalCardId)) {
      const index = cardedGoldenIds.value.indexOf(normalCardId);
      cardedGoldenIds.value.splice(index, 1);
    } else {
      // Remove from normal carded slots, if needed
      const indexInNormal = cardedNormalIds.value.indexOf(normalCardId);
      if (indexInNormal > -1) {
        cardedNormalIds.value.splice(indexInNormal, 1);
      }
      cardedGoldenIds.value.push(normalCardId);
    }
  } else {
    if (cardedNormalIds.value.includes(normalCardId)) {
      const index = cardedNormalIds.value.indexOf(normalCardId);
      cardedNormalIds.value.splice(index, 1);
    } else {
      // Remove from golden carded slots, if needed
      const indexInGolden = cardedGoldenIds.value.indexOf(normalCardId);
      if (indexInGolden > -1) {
        cardedGoldenIds.value.splice(indexInGolden, 1);
      }
      cardedNormalIds.value.push(normalCardId);
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
  box-shadow: 0px 0px 15px 1px rgba(255, 234, 43, 1);
}

ul.cards-list .not-collected {
  color: red;
}
</style>
