<template>
  <header>
    <Dropdown v-model="selectedBuildName" :options="savedBuildKeys" />
    <InputText type="text" v-model="buildName" />
    <Button label="Save" @click="saveBuild" />
  </header>
  <div id="skills-and-groups">
    <div id="skills">
      <div class="lists">
        <SpellList title="Abilities" :spells="staticStore.abilities" />
        <SpellList title="Talents" :spells="staticStore.talents" />
      </div>
    </div>
    <SpellGroupList />
  </div>
</template>

<script setup async lang="ts">
import { computed, ref, type Ref } from 'vue'

import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'

import SpellGroupList from './SpellGroupList.vue'
import SpellList from './SpellList.vue'
import { save, list } from '@/services/build.service'
import type { Build } from '@/types/build.types';

const buildName = ref('my build')
const selectedBuildName = ref(undefined)

import { useStaticStore } from '@/stores/static'
import { useObservable } from '@vueuse/rxjs'
import { liveQuery } from 'dexie'

const staticStore = useStaticStore()

async function saveBuild() {
  await save({ name: buildName.value, abilitiesCards: [], talentsCards: [] })
}

const savedBuildsQuery = liveQuery(async () => list());
const savedBuilds: Ref<Build[]> = useObservable(savedBuildsQuery);
const savedBuildKeys = ref([] as string[]);
savedBuildsQuery.subscribe((val) => savedBuildKeys.value = val.map((build) => build.name));
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
