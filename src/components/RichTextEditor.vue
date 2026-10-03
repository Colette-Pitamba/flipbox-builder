<template>
  <div class="rich-text-editor">
    <!-- Hidden word so each toolbar is announced as "Front formatting" / "Back formatting". -->
    <span :id="toolbarSuffixId" hidden>formatting</span>

    <div
      class="toolbar"
      role="toolbar"
      :aria-labelledby="`${labelledby} ${toolbarSuffixId}`"
      @keydown="onToolbarKeydown"
    >
      <template v-for="(group, groupIndex) in groups" :key="groupIndex">
        <span v-if="groupIndex > 0" class="toolbar-divider" aria-hidden="true"></span>
        <button
          v-for="control in group"
          :key="control.id"
          :ref="el => setButtonRef(control.id, el)"
          type="button"
          class="toolbar-button"
          :class="{ 'is-active': control.isToggle && isActive(control) }"
          :tabindex="control.id === focusedId ? 0 : -1"
          :aria-pressed="control.isToggle ? isActive(control) : undefined"
          :aria-disabled="isDisabled(control) ? 'true' : undefined"
          :aria-keyshortcuts="control.keyshortcuts"
          :title="control.hint"
          @focus="focusedId = control.id"
          @click="run(control)"
        >
          {{ control.label }}
        </button>
      </template>
    </div>

    <EditorContent :editor="editor" class="editor-content" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, useId, watch } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import { editorExtensions } from '../editor/extensions.js';

const props = defineProps({
  labelledby: { type: String, required: true },
  modelValue: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['update:modelValue']);

const toolbarSuffixId = useId();

const editor = new Editor({
  extensions: editorExtensions,
  content: props.modelValue,
  editorProps: {
    attributes: {
      role: 'textbox',
      'aria-labelledby': props.labelledby,
      'aria-multiline': 'true',
    },
  },
  onUpdate: ({ editor: currentEditor }) => {
    emit('update:modelValue', currentEditor.getHTML());
  },
});

// Keeps the editor in sync if modelValue is changed from outside this
// component (for example, loaded from storage after a refresh).
watch(
  () => props.modelValue,
  value => {
    const isSame = value === editor.getHTML();
    if (!isSame) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  },
);

onBeforeUnmount(() => {
  editor.destroy();
});

// ---- Toolbar definition -------------------------------------------------
// Visible text labels (not icons) so every control is self-explanatory and
// needs no separate accessible name.
const groups = [
  [
    {
      id: 'bold',
      label: 'Bold',
      isToggle: true,
      active: 'bold',
      keyshortcuts: 'Control+B Meta+B',
      hint: 'Bold (Ctrl/⌘+B)',
      command: chain => chain.toggleBold(),
    },
    {
      id: 'italic',
      label: 'Italic',
      isToggle: true,
      active: 'italic',
      keyshortcuts: 'Control+I Meta+I',
      hint: 'Italic (Ctrl/⌘+I)',
      command: chain => chain.toggleItalic(),
    },
  ],
  [
    {
      id: 'bulletList',
      label: 'Bulleted list',
      isToggle: true,
      active: 'bulletList',
      keyshortcuts: 'Control+Shift+8 Meta+Shift+8',
      hint: 'Bulleted list (Ctrl/⌘+Shift+8)',
      command: chain => chain.toggleBulletList(),
    },
    {
      id: 'orderedList',
      label: 'Numbered list',
      isToggle: true,
      active: 'orderedList',
      keyshortcuts: 'Control+Shift+7 Meta+Shift+7',
      hint: 'Numbered list (Ctrl/⌘+Shift+7)',
      command: chain => chain.toggleOrderedList(),
    },
  ],
  [
    {
      id: 'undo',
      label: 'Undo',
      keyshortcuts: 'Control+Z Meta+Z',
      hint: 'Undo (Ctrl/⌘+Z)',
      command: chain => chain.undo(),
      can: () => editor.can().undo(),
    },
    {
      id: 'redo',
      label: 'Redo',
      keyshortcuts: 'Control+Shift+Z Meta+Shift+Z',
      hint: 'Redo (Ctrl/⌘+Shift+Z)',
      command: chain => chain.redo(),
      can: () => editor.can().redo(),
    },
  ],
];

const controls = groups.flat();

// @tiptap/vue-3's Editor keeps its state reactive, so these re-evaluate
// on every transaction (typing, selection changes, undo, etc.).
const isActive = control => editor.isActive(control.active);
const isDisabled = control => (control.can ? !control.can() : false);

function run(control) {
  // aria-disabled (not `disabled`) keeps the button focusable for keyboard
  // users, so the click handler is responsible for ignoring it.
  if (isDisabled(control)) return;
  control.command(editor.chain().focus()).run();
}

// ---- Roving tabindex (WAI-ARIA toolbar pattern) ----------------------------
// The toolbar is a single Tab stop; Left/Right/Home/End move between buttons.
const focusedId = ref(controls[0].id);
const buttonRefs = new Map();

function setButtonRef(id, el) {
  if (el) buttonRefs.set(id, el);
  else buttonRefs.delete(id);
}

function onToolbarKeydown(event) {
  const index = controls.findIndex(control => control.id === focusedId.value);
  let next;

  switch (event.key) {
    case 'ArrowRight':
      next = (index + 1) % controls.length;
      break;
    case 'ArrowLeft':
      next = (index - 1 + controls.length) % controls.length;
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = controls.length - 1;
      break;
    default:
      return;
  }

  event.preventDefault();
  focusedId.value = controls[next].id;
  buttonRefs.get(focusedId.value)?.focus();
}

defineExpose({ editor });
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #fff;
}

.rich-text-editor:focus-within {
  border-color: #0969da;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border-bottom: 1px solid #d0d7de;
}

.toolbar-divider {
  width: 1px;
  align-self: stretch;
  margin: 0 4px;
  background: #d0d7de;
}

.toolbar-button {
  font: inherit;
  font-size: 0.875rem;
  padding: 4px 10px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #fff;
  color: #1f2328;
  cursor: pointer;
}

.toolbar-button:hover {
  background: #f3f4f6;
}

.toolbar-button:focus-visible {
  outline: 2px solid #0969da;
  outline-offset: 2px;
}

/* Active state uses more than colour: weight + border + background. */
.toolbar-button.is-active {
  background: #ddf4ff;
  border-color: #0969da;
  color: #0550ae;
  font-weight: 600;
}

.toolbar-button[aria-disabled='true'] {
  color: #8c959f;
  cursor: not-allowed;
}

.editor-content {
  padding: 10px;
  min-height: 120px;
}

.editor-content :deep(.tiptap) {
  min-height: 100px;
  outline: none;
  overflow-wrap: anywhere;
}

.editor-content :deep(p) {
  margin: 0 0 8px;
}

.editor-content :deep(ul),
.editor-content :deep(ol) {
  margin: 0 0 8px;
  padding-left: 24px;
}

.editor-content :deep(li > p) {
  margin: 0;
}
</style>