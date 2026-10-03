import { getSchema } from '@tiptap/core';
import { DOMParser as SchemaParser, DOMSerializer } from '@tiptap/pm/model';
import { editorExtensions } from './extensions.js';

// Build the same ProseMirror schema the editor uses.
const schema = getSchema(editorExtensions);
const parser = SchemaParser.fromSchema(schema);
const serializer = DOMSerializer.fromSchema(schema);

/**
 * Round-trips HTML through the editor schema before it is rendered with
 * v-html. Unknown tags, attributes, event handlers and scripts are dropped
 * because the schema has no way to represent them.
 *
 * The browser's DOMParser creates an inert document, so nothing in the
 * input runs while it is parsed.
 *
 * @param {string} html
 * @returns {{ html: string, isEmpty: boolean }}
 */
export function toSafeRichText(html) {
  if (typeof html !== 'string' || html.trim() === '') {
    return { html: '', isEmpty: true };
  }

  const source = new window.DOMParser().parseFromString(html, 'text/html');
  const doc = parser.parse(source.body);

  const container = document.createElement('div');
  container.appendChild(serializer.serializeFragment(doc.content));

  return {
    html: container.innerHTML,
    isEmpty: doc.textContent.trim() === '',
  };
}
