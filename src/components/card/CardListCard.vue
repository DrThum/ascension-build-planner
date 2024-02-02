<template>
  <span v-tooltip.left="spell.description"
    ><span class="card-spell-name">
      {{ spell.name }}
    </span>
    <br />
    <span
      v-if="collectedRank.normal > 0 && card.maxRank === 1"
      class="card-collected-indicator spell-metadata"
      >N</span
    >
    <span
      v-if="collectedRank.normal > 0 && card.maxRank > 1"
      class="card-collected-indicator spell-metadata"
      >{{ collectedRank.normal }}/{{ card.maxRank }}</span
    >
    <span
      v-if="collectedRank.golden > 0 && card.maxRank === 1"
      class="card-collected-indicator golden spell-metadata"
      >G</span
    >
    <span
      v-if="collectedRank.golden > 0 && card.maxRank > 1"
      class="card-collected-indicator golden spell-metadata"
      >{{ collectedRank.golden }}/{{ card.maxRank }}</span
    >
    <span class="required-level spell-metadata">(lvl {{ card.requiredLevel }})</span></span
  >

  <div>
    <Button
      icon="pi pi-credit-card"
      severity="secondary"
      text
      class="p-button-xsm"
      @click="toggleMenu"
    />
    <Menu ref="menu" :model="menuItems" :popup="true" />

    <Button
      icon="pi pi-trash"
      role="remove-spell"
      severity="secondary"
      text
      class="p-button-xsm"
      @click="props.onDelete(props.card)"
    />
  </div>
</template>

<script setup lang="ts">
import { type PropType, computed, ref } from 'vue';
import Menu from 'primevue/menu';
import { PrimeIcons } from 'primevue/api';
import Button from 'primevue/button';

import { useCardsStore } from '../../stores/cards';

import { CardSlotType, type Card, type CardCategory } from '../../types/cards.types';

const props = defineProps({
  card: {
    type: Object as PropType<Card>,
    required: true,
  },
  category: {
    type: String as PropType<CardCategory>,
    required: true,
  },
  currentSlot: {
    type: String as PropType<CardSlotType>,
    required: true,
  },
  hasFreeStartingSlots: {
    type: Boolean,
    required: true,
  },
  hasFreeNormalSlots: {
    type: Boolean,
    required: true,
  },
  hasFreeGoldenSlots: {
    type: Boolean,
    required: true,
  },
  onDelete: {
    type: Function,
    required: true,
  },
  slotCard: {
    type: Function,
    required: true,
  },
});

const cardsStore = useCardsStore();

const spell = computed(() => {
  return cardsStore.spellForCard(props.card.normalCardId, props.category, false);
});

const collectedRank = computed(() => {
  return {
    normal: cardsStore.collectedRank(props.card.normalCardId, false),
    golden: cardsStore.collectedRank(props.card.goldenCardId, true),
  };
});

const menu = ref();
function toggleMenu(event: Event) {
  menu.value.toggle(event);
}

const menuItems = computed(() => {
  const isSlottedStarting = props.currentSlot === CardSlotType.Starting;
  const isSlottedNormal = props.currentSlot === CardSlotType.Normal;
  const isSlottedGolden = props.currentSlot === CardSlotType.Golden;

  return [
    {
      label: isSlottedNormal ? 'Unslot' : 'Slot as normal',
      class: !props.hasFreeNormalSlots && !isSlottedNormal ? 'slot-disabled' : '',
      icon:
        (collectedRank.value.normal > 0 && props.hasFreeNormalSlots) || isSlottedNormal
          ? PrimeIcons.CHECK_CIRCLE
          : PrimeIcons.EXCLAMATION_CIRCLE,
      command: () => {
        props.slotCard(props.card, props.currentSlot, CardSlotType.Normal);
      },
    },
    {
      label: isSlottedGolden ? 'Unslot' : 'Slot as golden',
      class: !props.hasFreeGoldenSlots && !isSlottedGolden ? 'slot-disabled' : '',
      icon:
        (collectedRank.value.golden > 0 && props.hasFreeGoldenSlots) || isSlottedGolden
          ? PrimeIcons.CHECK_CIRCLE
          : PrimeIcons.EXCLAMATION_CIRCLE,
      command: () => {
        props.slotCard(props.card, props.currentSlot, CardSlotType.Golden);
      },
    },
    ...(props.card.requiredLevel <= 1
      ? [
          {
            label: isSlottedStarting ? 'Unset as starting' : 'Set as starting',
            class: !props.hasFreeStartingSlots && !isSlottedStarting ? 'slot-disabled' : '',

            icon:
              props.hasFreeStartingSlots || isSlottedStarting
                ? PrimeIcons.CHECK_CIRCLE
                : PrimeIcons.EXCLAMATION_CIRCLE,
            command: () => {
              props.slotCard(props.card, props.currentSlot, CardSlotType.Starting);
            },
          },
        ]
      : []),
  ];
});
</script>
