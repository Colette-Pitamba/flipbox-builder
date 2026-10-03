<template>
  <div class="flipbox-builder">
    <div class="field">
      <span :id="frontLabelId" class="field-label">Front</span>
      <RichTextEditor :labelledby="frontLabelId" v-model="front" />
    </div>

    <div class="field">
      <span :id="backLabelId" class="field-label">Back</span>
      <RichTextEditor :labelledby="backLabelId" v-model="back" />
    </div>

    <p v-if="saveState === 'error'" class="save-status save-status--error" role="alert">
      Couldn't save. Your changes may be lost if you refresh this page.
    </p>
    <p v-else class="save-status">{{ statusText }}</p>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import RichTextEditor from './RichTextEditor.vue';
import { loadFromStorage, saveToStorage } from '../composables/usePersistence.js';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue']);

const frontLabelId = useId();
const backLabelId = useId();

// Derive both fields from the parent so loading or resetting a card
// updates the editors as well as the preview.
const front = computed({
  get: () => props.modelValue.front,
  set: value => emit('update:modelValue', { ...props.modelValue, front: value }),
});
const back = computed({
  get: () => props.modelValue.back,
  set: value => emit('update:modelValue', { ...props.modelValue, back: value }),
});

// ---- Persistence ---------------------------------------------------------
// Data shape: { version, front, back, savedAt }. The version number lets a
// future shape change migrate (or ignore) old data instead of crashing.
const STORAGE_KEY = 'flipbox-builder:flipbox';
const STORAGE_VERSION = 1;
const SAVE_DELAY_MS = 400;

function parseStored(data) {
  const isValid =
    data &&
    data.version === STORAGE_VERSION &&
    typeof data.front === 'string' &&
    typeof data.back === 'string';

  if (!isValid) {
    if (data) console.warn(`Ignoring unrecognised data in "${STORAGE_KEY}"`);
    return null;
  }
  return { front: data.front, back: data.back };
}

const snapshot = () =>
  JSON.stringify({ front: props.modelValue.front, back: props.modelValue.back });

const saveState = ref('idle'); // 'idle' | 'pending' | 'saved' | 'error'
const statusText = computed(
  () =>
    ({
      idle: 'Changes save automatically.',
      pending: 'Saving…',
      saved: 'All changes saved.',
    })[saveState.value],
);

let hasLoaded = false;
let lastSaved = null;
let timer = null;

function flushSave() {
  clearTimeout(timer);
  timer = null;

  const current = snapshot();
  if (current === lastSaved) return;

  const ok = saveToStorage(STORAGE_KEY, {
    version: STORAGE_VERSION,
    front: props.modelValue.front ?? '',
    back: props.modelValue.back ?? '',
    savedAt: new Date().toISOString(),
  });

  if (ok) lastSaved = current;
  saveState.value = ok ? 'saved' : 'error';
}

// Debounced autosave so localStorage isn't written on every keystroke.
watch(
  () => [props.modelValue.front, props.modelValue.back],
  () => {
    if (!hasLoaded || snapshot() === lastSaved) return;
    saveState.value = 'pending';
    clearTimeout(timer);
    timer = setTimeout(flushSave, SAVE_DELAY_MS);
  },
);

onMounted(() => {
  const stored = parseStored(loadFromStorage(STORAGE_KEY));
  if (stored) {
    lastSaved = JSON.stringify(stored);
    emit('update:modelValue', { ...props.modelValue, ...stored });
  } else {
    lastSaved = snapshot();
  }
  hasLoaded = true;

  // A refresh inside the debounce window would otherwise drop the last edit.
  window.addEventListener('pagehide', flushSave);
});

onBeforeUnmount(() => {
  window.removeEventListener('pagehide', flushSave);
  flushSave();
});
</script>

<style scoped>
.flipbox-builder {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
}

.save-status {
  margin: 0;
  font-size: 0.875rem;
  color: #57606a;
}

.save-status--error {
  color: #cf222e;
  font-weight: 600;
}
</style>