import StarterKit from "@tiptap/starter-kit";

// Content Schema
//
// StarterKit ships more than the task needs. Extensions with no toolbar
// button are turned off so markdown shortcuts (e.g. typing "# ") can't
// create formatting the user has no visible way to undo or remove.

export const editorExtensions = [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    codeBlock: false,
    code: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    link: false
  }),
];