<template>
  <div class="spell-list-container">
    <h2>{{ title }}</h2>

    <h3>Card slots</h3>

    <ul class="spells-list">
      <li v-for="card in cardedNormalAsSpells" :class="qualityToCssClass(card.quality)">
        <span v-tooltip.left="card.description">{{ card.spellName }}</span>
      </li>
    </ul>

    <ul class="spells-list">
      <li
        v-for="spell in cardedGoldenAsSpells"
        :class="qualityToCssClass(spell.quality)"
        class="golden"
      >
        <span v-tooltip.left="spell.description">{{ spell.spellName }}</span>
      </li>
    </ul>

    <h3>All {{ title.toLowerCase() }}</h3>
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
      <li v-for="spell in spells" :class="qualityToCssClass(spell.quality)">
        <span v-tooltip.left="spell.description">{{ spell.spellName }}</span>
        <div>
          <Button
            icon="pi pi-credit-card"
            severity="secondary"
            text
            rounded
            @click="toggleMenu(spell.spellId, $event)"
          />
          <Menu
            :ref="(el) => (slotCardMenuRefs[spell.spellId] = el)"
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
            @click="removeSpell(spell.spellId)"
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

const spellIds: Ref<number[]> = defineModel({ required: true });
const cardedNormalIds: Ref<number[]> = defineModel('cardSlotsNormal', { required: true });
const cardedGoldenIds: Ref<number[]> = defineModel('cardSlotsGolden', { required: true });

const slotCardMenuRefs = ref({} as { [x: number]: any });

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  cardCategory: {
    type: Object as PropType<CardCategory>,
    required: true,
  },
});

const search = ref('');
const searchResults = ref([] as Array<Card>);

const source = _.uniqBy(
  props.cardCategory === CardCategory.Ability ? staticStore.abilities : staticStore.talents,
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
  const source =
    props.cardCategory === CardCategory.Ability ? staticStore.abilities : staticStore.talents;

  // TODO: Move the ability to get a spell by ID to the static store
  return spellIds
    .value!.map((spellId) => source.find((sourceSpell) => sourceSpell.spellId === spellId))
    .filter((spell) => spell !== undefined) as Card[];
});

const cardedNormalAsSpells = computed(() => {
  const source =
    props.cardCategory === CardCategory.Ability ? staticStore.abilities : staticStore.talents;

  return cardedNormalIds
    .value!.map((spellId) => source.find((sourceCard) => sourceCard.spellId === spellId))
    .filter((spell) => spell !== undefined) as Card[];
});

const cardedGoldenAsSpells = computed(() => {
  const source =
    props.cardCategory === CardCategory.Ability ? staticStore.abilities : staticStore.talents;

  return cardedGoldenIds
    .value!.map((spellId) => source.find((sourceSpell) => sourceSpell.spellId === spellId))
    .filter((spell) => spell !== undefined) as Card[];
});

function spellSelected(ev: AutoCompleteItemSelectEvent) {
  spellIds.value!.push(ev.value.spellId);
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
    const index = spellIds.value!.indexOf(removedSpellId);
    spellIds.value!.splice(index, 1);
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
