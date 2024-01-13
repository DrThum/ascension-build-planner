<template>
  <header>
    <Dropdown v-model="selectedBuildName" @change="buildSelected" :options="savedBuilds" optionLabel="name" />
    <InputText type="text" v-model="currentBuild.name" />
    <Button label="Save" @click="saveBuild" />

    {{ currentBuild }}
  </header>
  <div id="skills-and-groups">
    <div id="skills">
      <div class="lists">
        <SpellList title="Abilities" :spellIds="currentBuild.abilitiesCards" type="abilities" />
        <SpellList title="Talents" :spellIds="currentBuild.talentsCards" type="talents" />
      </div>
    </div>
    <SpellGroupList />
  </div>
</template>

<script setup async lang="ts">
import { ref, type Ref, reactive, toRaw } from 'vue'

import Button from 'primevue/button'
import Dropdown, { type DropdownChangeEvent } from 'primevue/dropdown'
import InputText from 'primevue/inputtext'

import SpellGroupList from './SpellGroupList.vue'
import SpellList from './SpellList.vue'
import { upsert, list } from '@/services/build.service'
import type { Build } from '@/types/build.types';

import { useObservable } from '@vueuse/rxjs'
import { liveQuery } from 'dexie'

const selectedBuildName = ref<string>('')

const currentBuild = reactive({
  id: undefined,
  name: '',
  abilitiesCards: [],
  talentsCards: [],
} as Build)

function buildSelected(ev: DropdownChangeEvent) {
  currentBuild.id = ev.value.id;
  currentBuild.name = ev.value.name;
  currentBuild.abilitiesCards = ev.value.abilitiesCards;
  currentBuild.talentsCards = ev.value.talentsCards;
}

async function saveBuild() {
  await upsert(toRaw(currentBuild))
}

const savedBuilds: Ref<Build[]> = useObservable(liveQuery(async () => list()));
</script>

<style scoped>
#skills-and-groups {
  display: flex;
  width: 100%;
}

#skills {
  display: flex;
  flex-direction: column;
  flex-grow: 2;
}

#skills>div.lists {
  display: flex;
  flex-grow: 1;
}

#skills>div.search-container input {
  min-width: 500px;
}
</style>
