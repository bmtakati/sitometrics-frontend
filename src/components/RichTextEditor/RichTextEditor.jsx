import React, { useEffect, useRef } from 'react';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';

// Defined outside the component so the object references are stable across
// renders. Passing new object references on every render causes react-quilljs
// to re-initialize Quill, which can call Object.keys on a null attribute delta.
const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'blockquote', 'code-block'],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list',
  'link', 'blockquote', 'code-block',
];

const QUILL_OPTIONS = {
  theme: 'snow',
  modules: QUILL_MODULES,
  formats: QUILL_FORMATS,
  placeholder: 'Write the answer here...',
};

const RichTextEditor = ({
  value = '',
  onChange,
  error = null,
  darkMode = false,
  minHeight = 220,
  maxHeight = null,
}) => {
  const { quill, quillRef } = useQuill(QUILL_OPTIONS);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!quill) return;
    const handler = () => onChangeRef.current(quill.root.innerHTML);
    quill.on('text-change', handler);
    return () => quill.off('text-change', handler);
  }, [quill]);

  // Sync external value into editor (e.g. when form resets)
  useEffect(() => {
    if (!quill) return;
    const incoming = value ?? '';
    // Avoid a paste-then-re-fire loop: only push when the content genuinely differs
    if (quill.root.innerHTML !== incoming) {
      quill.clipboard.dangerouslyPasteHTML(incoming);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quill, value]);

  return (
    <div className="sqas-richtext">
      <div
        className={`border rounded-lg ${error ? 'border-red-500' : darkMode ? 'border-gray-600' : 'border-gray-300'} ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        <div ref={quillRef} className="sqas-richtext-editor" />
      </div>

        {/* Quill "snow" theme overrides to match the modal styling */}
      <style>
        {`
          .sqas-richtext-editor .ql-toolbar {
            border-top-left-radius: 0.5rem;
            border-top-right-radius: 0.5rem;
          }
          .sqas-richtext .ql-toolbar.ql-snow {
            border-color: ${darkMode ? '#374151' : '#93c5fd'} !important;
            background: ${darkMode ? '#0b1220' : '#eff6ff'} !important; /* primary tint */
            color: ${darkMode ? '#e5e7eb' : '#1d4ed8'} !important;
          }

          .sqas-richtext .ql-container.ql-snow {
            border-color: ${darkMode ? '#374151' : '#93c5fd'} !important;
            background: ${darkMode ? '#0b1220' : '#ffffff'} !important;
          }

          .sqas-richtext .ql-editor {
            color: ${darkMode ? '#e5e7eb' : '#111827'} !important;
            background: transparent !important;
            min-height: ${minHeight}px;
            ${maxHeight ? `max-height: ${maxHeight}px; overflow-y: auto;` : ''}
          }

          .sqas-richtext .ql-picker-label,
          .sqas-richtext .ql-stroke,
          .sqas-richtext .ql-toolbar button {
            color: ${darkMode ? '#e5e7eb' : '#1d4ed8'} !important;
          }

          ${darkMode ? `.sqas-richtext .ql-editor::before { color: #6b7280 !important; }` : ''}
        `}
      </style>
    </div>
  );
};

export default RichTextEditor;

