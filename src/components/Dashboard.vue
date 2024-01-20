<template>
  <Toast />
  <ConfirmPopup></ConfirmPopup>
  <header v-if="currentBuild && currentBuild.name">
    <div class="build-controls">
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
        @click="deleteBuild($event)"
      />
      <Button
        icon="pi pi-share-alt"
        iconPos="right"
        label="Share"
        severity="success"
        @click="shareBuild"
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
            :threshold="36"
            v-model="currentBuild.abilityCardIds"
            v-model:cardSlotsNormal="currentBuild.cardedSetup.abilityNormalIds"
            v-model:cardSlotsGolden="currentBuild.cardedSetup.abilityGoldenIds"
            :card-category="CardCategory.Ability"
          />
          <CardList
            title="Talents"
            :threshold="51"
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
    <div class="no-build-container">
      <div v-if="savedBuilds && savedBuilds.length > 0">
        <div class="load-build-controls">
          <Dropdown
            v-model="selectedBuildId"
            :options="savedBuilds"
            optionLabel="name"
            optionValue="id"
          />
          <Button icon="pi pi-folder-open" label="Load" iconPos="right" @click="loadBuild" />
        </div>
        <hr />
      </div>
      <div class="load-build-controls">
        <InputText type="text" v-model="newBuildName" />
        <Button icon="pi pi-plus-circle" iconPos="right" label="Create" @click="create" />
      </div>
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
import { ref, type Ref, reactive, toRaw, onBeforeMount, watch } from 'vue';

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import TextArea from 'primevue/textarea';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import ConfirmPopup from 'primevue/confirmpopup';

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
const confirm = useConfirm();

function loadBuild() {
  Object.assign(
    currentBuild,
    savedBuilds.value.find((sb) => sb.id === selectedBuildId.value),
  );
}

async function saveBuild() {
  const buildId = await upsert(toRaw(currentBuild));
  currentBuild.id = buildId;

  toast.add({
    severity: 'success',
    summary: 'Done',
    detail: 'Build saved',
    life: 3000,
  });
}

function closeBuild() {
  for (const prop in currentBuild) {
    delete currentBuild[prop as keyof Build];
  }
}

async function deleteBuild(event: MouseEvent) {
  confirm.require({
    target: event.currentTarget! as HTMLElement,
    message: 'Are you sure you want to delete this build?',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger p-button-sm',
    accept: async () => {
      if (currentBuild.id) {
        await deleteById(currentBuild.id);
      }

      closeBuild();
      toast.add({ severity: 'info', summary: 'Build deleted', life: 3000 });
    },
    reject: () => {},
  });
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

  // Load shared build, if any
  const urlParams = new URLSearchParams(window.location.search);
  const sharedBuildBase64 = urlParams.get('build');
  if (sharedBuildBase64) {
    try {
      const sharedBuild = JSON.parse(atob(sharedBuildBase64));
      Object.assign(currentBuild, sharedBuild, { id: undefined });

      urlParams.delete('build');
      window.history.replaceState({}, '', window.location.href.split('?')[0]);
    } catch (e) {
      console.error('error loading shared build:', e);

      toast.add({
        severity: 'error',
        summary: 'Error importing build',
        detail: 'The imported build format is incorrect',
        life: 3000,
      });
    }
  }
});

function shareBuild() {
  const base = window.location.href.split('?')[0];
  const buildAsBase64 = btoa(JSON.stringify({ ...currentBuild, id: undefined }));

  navigator.clipboard.writeText(`${base}?build=${buildAsBase64}`);

  toast.add({
    severity: 'success',
    summary: 'Build sharing URL copied',
    detail: 'The sharing URL is now in your clipboard',
    life: 3000,
  });
}

const savedBuilds: Ref<Build[]> = useObservable(from(liveQuery(async () => list())));

watch(savedBuilds, (newSavedBuilds) => {
  if (!selectedBuildId.value && newSavedBuilds.length > 0) {
    selectedBuildId.value = newSavedBuilds[newSavedBuilds.length - 1].id!;
  }
});

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
.build-controls .p-button {
  margin-left: 40px;
}

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
  height: 98vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: auto;
}

.no-build-container {
  min-width: 25%;
  display: flex;
  flex-direction: column;
}

.load-build-controls {
  display: flex;
}

.load-build-controls :first-child {
  flex-grow: 1;
  margin-right: 10px;
}
</style>
