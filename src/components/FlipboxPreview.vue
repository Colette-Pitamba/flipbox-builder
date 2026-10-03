<template>
  <div class="flipbox-preview">
    <div class="flipbox" :class="{ 'is-flipped': isBack }">
      <div class="flipbox-inner">
        <!--
          The hidden face is `inert`: removed from the tab order and from
          the accessibility tree, so screen readers only ever read the side
          that is actually showing.
        -->
        <section
          :id="frontId"
          class="flipbox-face flipbox-front"
          :aria-labelledby="frontTitleId"
          :inert="isBack"
        >
          <p :id="frontTitleId" class="face-tag">Front</p>
          <div v-if="!front.isEmpty" class="flipbox-content" v-html="front.html"></div>
          <p v-else class="face-empty">Nothing on the front yet.</p>
        </section>

        <section
          :id="backId"
          class="flipbox-face flipbox-back"
          :aria-labelledby="backTitleId"
          :inert="!isBack"
        >
          <p :id="backTitleId" class="face-tag">Back</p>
          <div v-if="!back.isEmpty" class="flipbox-content" v-html="back.html"></div>
          <p v-else class="face-empty">Nothing on the back yet.</p>
        </section>
      </div>
    </div>

    <div class="flipbox-controls">
      <!-- Visible text state: doesn't depend on seeing the animation. -->
      <p class="side-indicator" aria-hidden="true">
        Showing <strong>{{ isBack ? 'back' : 'front' }}</strong> ({{ isBack ? 2 : 1 }} of 2)
      </p>
      <button
        type="button"
        class="flip-button"
        :aria-controls="`${frontId} ${backId}`"
        @click="flip"
      >
        {{ isBack ? 'Flip to front' : 'Flip to back' }}
      </button>
    </div>

    <!-- Screen-reader announcement, only after the learner flips. -->
    <p class="visually-hidden" aria-live="polite">{{ announcement }}</p>
  </div>
</template>

<script setup>
import { computed, ref, useId } from 'vue';
import { toSafeRichText } from '../editor/sanitize.js';

const props = defineProps({
  flipbox: {
    type: Object,
    required: true,
  },
});

const frontId = useId();
const backId = useId();
const frontTitleId = useId();
const backTitleId = useId();

const side = ref('front');
const isBack = computed(() => side.value === 'back');
const announcement = ref('');

// Recomputed on every edit, so the preview stays live with the builder.
const front = computed(() => toSafeRichText(props.flipbox.front));
const back = computed(() => toSafeRichText(props.flipbox.back));

function flip() {
  side.value = isBack.value ? 'front' : 'back';
  announcement.value = `Showing the ${side.value} of the card.`;
}
</script>

<style scoped>
.flipbox-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.flipbox {
  width: 280px;
  max-width: 100%;
  min-width: 0;
  perspective: 1000px;
}

/* Both faces sit in the same grid cell, so the card grows to fit
   whichever side has more content instead of clipping it. */
.flipbox-inner {
  display: grid;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}

.flipbox.is-flipped .flipbox-inner {
  transform: rotateY(180deg);
}

.flipbox-face {
  grid-area: 1 / 1;
  min-height: 180px;
  padding: 16px;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  background: #ffffff;
  overflow-wrap: anywhere;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flipbox-back {
  transform: rotateY(180deg);
  background: #f6f8fa;
}

.face-tag {
  margin: 0 0 10px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #57606a;
}

.face-empty {
  margin: 0;
  color: #6e7781;
  font-style: italic;
}

.flipbox-content :deep(p) {
  margin: 0 0 8px;
}

.flipbox-content :deep(ul),
.flipbox-content :deep(ol) {
  margin: 0 0 8px;
  padding-left: 24px;
}

.flipbox-content :deep(li > p) {
  margin: 0;
}

.flipbox-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.side-indicator {
  margin: 0;
  font-size: 0.875rem;
  color: #57606a;
}

.flip-button {
  font: inherit;
  padding: 6px 14px;
  border: 1px solid #0969da;
  border-radius: 6px;
  background: #0969da;
  color: #ffffff;
  cursor: pointer;
}

.flip-button:hover {
  background: #0550ae;
}

.flip-button:focus-visible {
  outline: 2px solid #0969da;
  outline-offset: 2px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .flipbox-inner {
    transition: none;
  }
}
</style>