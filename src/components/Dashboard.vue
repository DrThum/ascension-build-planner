<template>
  <header v-if="currentBuild && currentBuild.name">
    <InputText type="text" v-model="currentBuild.name" />
    <Button icon="pi pi-save" iconPos="right" label="Save" @click="saveBuild" />
    <Button icon="pi pi-times" iconPos="right" label="Close" severity="secondary" @click="closeBuild" />
    <Button icon="pi pi-trash" iconPos="right" label="Delete" severity="danger" @click="deleteBuild" />
  </header>
  <main v-if="currentBuild && currentBuild.name">
    <div id="skills-and-groups">
      <div id="skills">
        <div class="lists">
          <SpellList title="Abilities" v-model="currentBuild.abilitiesCards" type="abilities" />
          <SpellList title="Talents" v-model="currentBuild.talentsCards" type="talents" />
        </div>
      </div>
      <SpellGroupList />
    </div>
  </main>
  <main v-else class="no-build">
    <div v-if="savedBuilds && savedBuilds.length > 0">
      <Dropdown v-model="selectedBuildId" :options="savedBuilds" optionLabel="name" optionValue="id" />
      <Button icon="pi pi-folder-open" label="Load" iconPos="right" @click="loadBuild" />
      <hr />
      <InputText type="text" v-model="newBuildName" />
      <Button icon="pi pi-plus-circle" iconPos="right" label="Create" @click="create" />
    </div>
  </main>
</template>

<script setup async lang="ts">
import { ref, type Ref, reactive, toRaw } from 'vue'

import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'

import SpellGroupList from './SpellGroupList.vue'
import SpellList from './SpellList.vue'
import { deleteById, upsert, list } from '@/services/build.service'
import type { Build } from '@/types/build.types';

import { useObservable } from '@vueuse/rxjs'
import { liveQuery } from 'dexie'

const currentBuild = reactive({} as Build)
const selectedBuildId = ref(0);
const newBuildName = ref('');

function loadBuild() {
  Object.assign(currentBuild, savedBuilds.value.find((sb) => sb.id === selectedBuildId.value));
}

async function saveBuild() {
  const buildId = await upsert(toRaw(currentBuild));
  currentBuild.id = buildId;
}

function closeBuild() {
  for (const prop in currentBuild) {
    delete currentBuild[prop];
  }
}

async function deleteBuild() {
  await deleteById(currentBuild.id);
  closeBuild();
}

async function create() {
  const newBuild: Build = {
    id: undefined,
    name: newBuildName.value,
    abilitiesCards: [],
    talentsCards: []
  };

  const buildId = await upsert(newBuild);
  selectedBuildId.value = buildId;
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

main.no-build {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: auto;
}
</style>
