<template>
  <Toast />
  <ConfirmPopup></ConfirmPopup>
  <header v-if="currentBuild && (currentBuild.id || currentBuild.name)">
    <div class="build-controls">
      <InputText v-model="currentBuild.name" type="text" />
      <Button icon="pi pi-save" icon-pos="right" label="Save" @click="saveBuild" />
      <Button
        icon="pi pi-times"
        icon-pos="right"
        label="Close"
        severity="secondary"
        @click="closeBuild"
      />
      <Button
        icon="pi pi-trash"
        icon-pos="right"
        label="Delete"
        severity="danger"
        @click="deleteBuild($event)"
      />
      <Button
        icon="pi pi-share-alt"
        icon-pos="right"
        label="Share"
        severity="success"
        @click="shareBuild"
      />
    </div>
    <div>
      <Button
        icon="pi pi-folder-open"
        icon-pos="right"
        label="Import cards collection"
        @click="isImportDialogVisible = true"
      />
    </div>
  </header>
  <main v-if="currentBuild && (currentBuild.id || currentBuild.name)" class="dashboard-main">
    <div id="starting-abilities-and-notes">
      <div>
        <div id="starting-abilities">
          <h3>Starting abilities</h3>
          <ul>
            <li
              v-for="card in startAbilityCards"
              :key="card.normalCardId"
              :class="qualityToCssClass(card.quality)"
            >
              <CardSlot
                :card="card"
                :category="CardCategory.Ability"
                :onDelete="removeStartingCard"
              />
            </li>
            <li v-for="i in new Array(Math.max(4 - startAbilityCards.length, 0))" :key="i">
              <span class="empty-card-slot">&lt;empty slot&gt;</span>
            </li>
          </ul>
        </div>
      </div>
      <div>
        <Button
          icon="pi pi-pencil"
          icon-pos="right"
          label="Toggle notes"
          @click="notesVisible = true"
        />
        <Sidebar
          v-model:visible="notesVisible"
          header="Notes"
          position="right"
          class="notes-container"
          style="width: 40rem"
        >
          <textarea
            v-model="currentBuild.notes"
            placeholder="Enter your notes here (explanations, rotations, alternatives, ...)"
          ></textarea>
        </Sidebar>
      </div>
    </div>
    <div id="skills-and-groups">
      <div id="skills">
        <div class="lists">
          <CardList
            v-model="currentBuild.abilityCardIds"
            v-model:cardSlotsNormal="currentBuild.cardedSetup.abilityNormalIds"
            v-model:cardSlotsGolden="currentBuild.cardedSetup.abilityGoldenIds"
            v-model:startingCardIds="currentBuild.startAbilityCardIds"
            title="Abilities"
            :max-card-count="36"
            :card-slot-count="2"
            :card-category="CardCategory.Ability"
          />
          <CardList
            v-model="currentBuild.talentCardIds"
            v-model:cardSlotsNormal="currentBuild.cardedSetup.talentNormalIds"
            v-model:cardSlotsGolden="currentBuild.cardedSetup.talentGoldenIds"
            title="Talents"
            :max-card-count="51"
            :card-slot-count="3"
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
            option-label="name"
            option-value="id"
          />
          <Button icon="pi pi-folder-open" label="Load" icon-pos="right" @click="loadBuild" />
        </div>
        <hr />
      </div>
      <div class="load-build-controls">
        <InputText v-model="newBuildName" type="text" />
        <Button icon="pi pi-plus-circle" icon-pos="right" label="Create" @click="create" />
      </div>
    </div>
  </main>

  <Dialog v-model:visible="isImportDialogVisible" modal>
    <p>
      To import your card collection, please
      <a href="/SkillCardsCollector.zip" download>download the addon</a> and extract it in the
      Interface/AddOn folder of your client installation. Restart the game if needed. You should now
      have a button labelled "Export collection" on top of the Skill Cards tab of the Character
      Advancement window.
    </p>
    <p>
      <span class="important-warning">WARNING:</span> Please make sure that you load both tabs
      (Ability Cards and Talent Cards) at least once to load the cards and that you keep the
      "Collected Only" filter active!
    </p>
    <p>
      Upon clicking the "Export collection" button, your current card collection is stored in your
      clipboard. Paste it in the box below and click the Import button. That's it!
    </p>
    <TextArea v-model="collectionImportString" rows="5" style="width: 100%" />
    <template #footer>
      <Button label="Import" icon="pi pi-check" @click="importCollection" />
    </template>
  </Dialog>
</template>

<script setup async lang="ts">
import { ref, type Ref, reactive, toRaw, onBeforeMount, watch, computed } from 'vue';

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import TextArea from 'primevue/textarea';
import Sidebar from 'primevue/sidebar';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import ConfirmPopup from 'primevue/confirmpopup';

import CardGroupList from './CardGroupList.vue';
import CardList from './CardList.vue';
import CardSlot from './card/CardSlot.vue';
import { deleteById, upsert, list } from '@/services/build.service';
import { getCollection, replaceCollection } from '@/services/collection.service';
import type { Build } from '@/types/build.types';

import { useCardsStore } from '@/stores/cards';

import { liveQuery } from 'dexie';
import { CardCategory, CardQuality, type Card } from '@/types/cards.types';
import { useObservable, from } from '@vueuse/rxjs';

const currentBuild = reactive({} as Build);
const selectedBuildId = ref(0);
const newBuildName = ref('');
const isImportDialogVisible = ref(false);
const collectionImportString = ref('');
const notesVisible = ref(false);
const cardsStore = useCardsStore();

const toast = useToast();
const confirm = useConfirm();

function loadBuild() {
  Object.assign(
    currentBuild,
    { startAbilityCardIds: [] },
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
    startAbilityCardIds: [],
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

function b64decode(str: string): ArrayBuffer {
  const binary_string = window.atob(str.replace(/ /g, '+'));
  const len = binary_string.length;
  const bytes = new Uint8Array(new ArrayBuffer(len));
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

onBeforeMount(async () => {
  const collection = await getCollection();
  cardsStore.setCollection(collection);

  // Load shared build, if any
  const urlParams = new URLSearchParams(window.location.search);
  const sharedBuildBase64 = urlParams.get('build');
  if (sharedBuildBase64) {
    try {
      // https://dev.to/samternent/json-compression-in-the-browser-with-gzip-and-the-compression-streams-api-4135
      // base64 encoding to Blob
      const stream = new Blob([b64decode(sharedBuildBase64)], {
        type: 'application/json',
      }).stream();

      const compressedReadableStream = stream.pipeThrough(new DecompressionStream('gzip'));

      const resp = new Response(compressedReadableStream);
      const blob = await resp.blob();

      const sharedBuild = JSON.parse(await blob.text());
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

async function shareBuild() {
  const base = window.location.href.split('?')[0];

  // https://dev.to/samternent/json-compression-in-the-browser-with-gzip-and-the-compression-streams-api-4135
  // Convert JSON to Stream
  const stream = new Blob([JSON.stringify({ ...currentBuild, id: undefined })], {
    type: 'application/json',
  }).stream();

  // gzip stream
  const compressedReadableStream = stream.pipeThrough(new CompressionStream('gzip'));

  // create Response
  const compressedResponse = new Response(compressedReadableStream);

  // Get response Blob
  const blob = await compressedResponse.blob();
  // Get the ArrayBuffer
  const buffer = await blob.arrayBuffer();

  // convert ArrayBuffer to base64 encoded string
  const buildAsBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

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
    console.error(`collection import error: {e}`);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to import cards collection (parsing error)',
      life: 3000,
    });
  } finally {
    isImportDialogVisible.value = false;
    collectionImportString.value = '';
  }
}

const startAbilityCards = computed(() => {
  return (
    (currentBuild?.startAbilityCardIds
      ?.map((cardId) => cardsStore.all.ability.find((c) => c.normalCardId === cardId))
      .filter((card) => card !== undefined) as Card[]) ?? []
  );
});

function removeStartingCard(card: Card) {
  const index = currentBuild?.startAbilityCardIds?.indexOf(card.normalCardId);
  if (index !== undefined && index > -1) {
    currentBuild?.startAbilityCardIds?.splice(index, 1);
  }
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

.lists .card-list-container:first-child {
  border-right: solid 3px;
  padding-right: 4px;
  margin-right: 8px;
}

.dashboard-main {
  padding-top: 20px;
}

#starting-abilities-and-notes {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.notes-container {
  width: 40rem;
}

.notes-container textarea {
  width: 100%;
  height: 99%;
}

#starting-abilities {
  display: flex;
  align-items: center;
}

#starting-abilities ul {
  display: flex;
  list-style: none;
}

#starting-abilities ul li {
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

#starting-abilities ul li.quality-common {
  border-color: #ffffff;
}

#starting-abilities ul li.quality-uncommon {
  border-color: #1eff00;
}

#starting-abilities ul li.quality-rare {
  border-color: #0070dd;
}

#starting-abilities ul li.quality-epic {
  border-color: #a335ee;
}

#starting-abilities ul li.quality-legendary {
  border-color: #ff8000;
}

.important-warning {
  color: red;
  font-weight: bold;
}
</style>
