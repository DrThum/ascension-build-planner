<template>
  <span v-tooltip.left="spell.description"
    >{{ spell.name }} (<span
      :class="{
        'not-collected': collectedRank === 0,
      }"
    >
      {{ collectedRank }}/{{ card.maxRank }} </span
    >)</span
  >

  <Button
    icon="pi pi-trash"
    role="remove-spell"
    severity="secondary"
    text
    class="p-button-xsm"
    @click="onDeleteButtonClicked"
  />
</template>

<script setup lang="ts">
import { type PropType, computed } from 'vue';
import Button from 'primevue/button';

import { useCardsStore } from '../../stores/cards';
import { type Card, type CardCategory } from '../../types/cards.types';

const props = defineProps({
  card: {
    type: Object as PropType<Card>,
    required: true,
  },
  category: {
    type: String as PropType<CardCategory>,
    required: true,
  },
  isGoldenSlot: {
    type: Boolean,
    default: false,
  },
  onDelete: {
    type: Function,
  },
});

const cardsStore = useCardsStore();

const spell = computed(() => {
  if (props.isGoldenSlot) {
    return cardsStore.spellForCard(props.card.goldenCardId, props.category, true);
  }

  return cardsStore.spellForCard(props.card.normalCardId, props.category, false);
});

const collectedRank = computed(() => {
  if (props.isGoldenSlot) {
    return cardsStore.collectedRank(props.card.goldenCardId, true);
  }

  return cardsStore.collectedRank(props.card.normalCardId, false);
});

function onDeleteButtonClicked() {
  if (props.onDelete) {
    props.onDelete(props.card);
  }
}
</script>

<style scoped>
.not-collected {
  color: red;
}
</style>
