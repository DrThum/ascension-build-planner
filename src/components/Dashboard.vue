<template>
  <Toast />
  <header v-if="currentBuild && currentBuild.name">
    <div>
      <InputText type="text" v-model="currentBuild.name" />
      <Button icon="pi pi-save" iconPos="right" label="Save" @click="saveBuild" />
      <Button
        icon="pi pi-times"
        iconPos="right"
        label="Close"
        severity="secondary"
        @click="closeBuild"
      />
      <Button
        icon="pi pi-trash"
        iconPos="right"
        label="Delete"
        severity="danger"
        @click="deleteBuild"
      />
    </div>
    <div>
      <Button
        icon="pi pi-folder-open"
        iconPos="right"
        label="Import cards collection"
        @click="isImportDialogVisible = true"
      />
    </div>
  </header>
  <main v-if="currentBuild && currentBuild.name">
    <div id="skills-and-groups">
      <div id="skills">
        <div class="lists">
          <CardList
            title="Abilities"
            v-model="currentBuild.abilityCardIds"
            v-model:cardSlotsNormal="currentBuild.cardedSetup.abilityNormalIds"
            v-model:cardSlotsGolden="currentBuild.cardedSetup.abilityGoldenIds"
            :card-category="CardCategory.Ability"
          />
          <CardList
            title="Talents"
            v-model="currentBuild.talentCardIds"
            v-model:cardSlotsNormal="currentBuild.cardedSetup.talentNormalIds"
            v-model:cardSlotsGolden="currentBuild.cardedSetup.talentGoldenIds"
            :card-category="CardCategory.Talent"
          />
        </div>
      </div>
      <!-- Disabled for now -->
      <CardGroupList v-if="false" />
    </div>
  </main>
  <main v-else class="no-build">
    <div v-if="savedBuilds && savedBuilds.length > 0">
      <Dropdown
        v-model="selectedBuildId"
        :options="savedBuilds"
        optionLabel="name"
        optionValue="id"
      />
      <Button icon="pi pi-folder-open" label="Load" iconPos="right" @click="loadBuild" />
      <hr />
    </div>
    <div>
      <InputText type="text" v-model="newBuildName" />
      <Button icon="pi pi-plus-circle" iconPos="right" label="Create" @click="create" />
    </div>
  </main>

  <Dialog v-model:visible="isImportDialogVisible" modal>
    <TextArea v-model="collectionImportString" rows="5" cols="100" />
    <template #footer>
      <Button label="Import" icon="pi pi-check" @click="importCollection" />
    </template>
  </Dialog>
</template>

<script setup async lang="ts">
import { ref, type Ref, reactive, toRaw, onBeforeMount } from 'vue';

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import TextArea from 'primevue/textarea';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

import CardGroupList from './CardGroupList.vue';
import CardList from './CardList.vue';
import { deleteById, upsert, list } from '@/services/build.service';
import { getCollection, replaceCollection } from '@/services/collection.service';
import type { Build } from '@/types/build.types';

import { useCardsStore } from '@/stores/cards';

import { liveQuery } from 'dexie';
import { CardCategory } from '@/types/cards.types';
import { useObservable, from } from '@vueuse/rxjs';

const currentBuild = reactive({} as Build);
const selectedBuildId = ref(0);
const newBuildName = ref('');
const isImportDialogVisible = ref(false);
const collectionImportString = ref('');
const cardsStore = useCardsStore();

const toast = useToast();

function loadBuild() {
  Object.assign(
    currentBuild,
    savedBuilds.value.find((sb) => sb.id === selectedBuildId.value),
  );
}

async function saveBuild() {
  const buildId = await upsert(toRaw(currentBuild));
  currentBuild.id = buildId;
}

function closeBuild() {
  for (const prop in currentBuild) {
    delete currentBuild[prop as keyof Build];
  }
}

async function deleteBuild() {
  if (currentBuild.id) {
    await deleteById(currentBuild.id);
  }

  closeBuild();
}

async function create() {
  const newBuild: Build = {
    id: undefined,
    name: newBuildName.value,
    abilityCardIds: [],
    talentCardIds: [],
    cardedSetup: {
      abilityNormalIds: [],
      abilityGoldenIds: [],
      talentNormalIds: [],
      talentGoldenIds: [],
    },
  };

  const buildId = await upsert(newBuild);
  selectedBuildId.value = buildId;
}

onBeforeMount(async () => {
  const collection = await getCollection();
  cardsStore.setCollection(collection);
});

const savedBuilds: Ref<Build[]> = useObservable(from(liveQuery(async () => list())));

async function importCollection() {
  if (!collectionImportString.value || collectionImportString.value.length === 0) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to import cards collection (provided value is empty)',
      life: 3000,
    });
    return;
  }

  try {
    const parsed = JSON.parse(collectionImportString.value);

    cardsStore.setCollection(parsed);

    await replaceCollection(parsed);
    toast.add({
      severity: 'success',
      summary: 'Done',
      detail: 'Successfully imported your cards collection',
      life: 3000,
    });
  } catch (e) {
    console.log(`collection import error: {e}`);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to import cards collection (parsing error)',
      life: 3000,
    });
  } finally {
    isImportDialogVisible.value = false;
  }
}
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

#skills > div.lists {
  display: flex;
  flex-grow: 1;
}

#skills > div.lists > .card-list-container {
  flex-grow: 1;
  flex-basis: 0;
}

#skills > div.search-container input {
  min-width: 500px;
}

header {
  display: flex;
  justify-content: space-between;
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
