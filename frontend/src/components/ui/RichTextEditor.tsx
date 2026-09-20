'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Undo,
  Redo,
  RemoveFormatting,
  CodeXml,
  Eye,
  Palette,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
  required?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write detailed specifications, instructions, or features...',
  minHeight = '260px',
  label,
  required,
}: RichTextEditorProps) {
  const [htmlMode, setHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(value || '');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TextStyle,
      Color,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none p-4 text-slate-800 dark:text-slate-200 text-sm leading-relaxed`,
        style: `min-height: ${minHeight};`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // If empty paragraph, return empty string
      const cleanHtml = html === '<p></p>' ? '' : html;
      onChange(cleanHtml);
      setRawHtml(cleanHtml);
    },
    immediatelyRender: false,
  });

  // Synchronize when value changes externally (e.g. data loaded from API)
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentHtml = editor.getHTML();
      if (value !== currentHtml && (value || '') !== (currentHtml === '<p></p>' ? '' : currentHtml)) {
        editor.commands.setContent(value || '', { emitUpdate: false });
        setRawHtml(value || '');
      }
    }
  }, [value, editor]);

  const handleRawHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextHtml = e.target.value;
    setRawHtml(nextHtml);
    onChange(nextHtml);
    if (editor) {
      editor.commands.setContent(nextHtml, { emitUpdate: false });
    }
  };

  const getWordAndCharCount = () => {
    if (!editor) return { words: 0, characters: 0 };
    const text = editor.getText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    return { words, characters };
  };

  const { words, characters } = getWordAndCharCount();

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>{words} words</span>
            <span>•</span>
            <span>{characters} chars</span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-sky-500/30 focus-within:border-sky-500 transition">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 select-none">
          <div className="flex flex-wrap items-center gap-1">
            {!htmlMode && editor && (
              <>
                {/* Bold */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                    editor.isActive('bold')
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-4 h-4" />
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                    editor.isActive('italic')
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-4 h-4" />
                </button>

                {/* Strikethrough */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                    editor.isActive('strike')
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

                {/* Color Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="p-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1"
                    title="Text Color"
                  >
                    <Palette className="w-4 h-4 text-sky-500" />
                  </button>
                  {showColorPicker && (
                    <div className="absolute top-full left-0 mt-1 z-30 p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      {[
                        { label: 'Default', color: 'inherit' },
                        { label: 'Blue', color: '#0284c7' },
                        { label: 'Green', color: '#16a34a' },
                        { label: 'Red', color: '#dc2626' },
                        { label: 'Amber', color: '#d97706' },
                        { label: 'Purple', color: '#9333ea' },
                        { label: 'Gray', color: '#64748b' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            if (item.color === 'inherit') {
                              editor.chain().focus().unsetColor().run();
                            } else {
                              editor.chain().focus().setColor(item.color).run();
                            }
                            setShowColorPicker(false);
                          }}
                          className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 hover:scale-110 transition shadow-xs"
                          style={{ backgroundColor: item.color === 'inherit' ? '#0f172a' : item.color }}
                          title={item.label}
                        />
                      ))}
                      <input
                        type="color"
                        onChange={(e) => {
                          editor.chain().focus().setColor(e.target.value).run();
                          setShowColorPicker(false);
                        }}
                        className="w-5 h-5 cursor-pointer rounded-full border-0 p-0"
                        title="Custom Color"
                      />
                    </div>
                  )}
                </div>

                <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

                {/* Heading 1 */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-0.5 ${
                    editor.isActive('heading', { level: 1 })
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </button>

                {/* Heading 2 */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-0.5 ${
                    editor.isActive('heading', { level: 2 })
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>

                {/* Heading 3 */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-0.5 ${
                    editor.isActive('heading', { level: 3 })
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Heading 3"
                >
                  <Heading3 className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

                {/* Bullet List */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                    editor.isActive('bulletList')
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>

                {/* Numbered List */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                    editor.isActive('orderedList')
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>

                {/* Blockquote */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                    editor.isActive('blockquote')
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Quote"
                >
                  <Quote className="w-4 h-4" />
                </button>

                {/* Code Block */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                    editor.isActive('codeBlock')
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Code Block"
                >
                  <Code className="w-4 h-4" />
                </button>

                {/* Horizontal Divider */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                  className="p-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  title="Divider Line"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

                {/* Clear Formatting */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                  className="p-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  title="Clear Formatting"
                >
                  <RemoveFormatting className="w-4 h-4" />
                </button>

                {/* Undo / Redo */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="p-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="p-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo className="w-4 h-4" />
                </button>
              </>
            )}
            {htmlMode && (
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 px-2">
                Raw HTML Source Mode
              </span>
            )}
          </div>

          {/* HTML Source Toggle Mode */}
          <button
            type="button"
            onClick={() => setHtmlMode(!htmlMode)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
              htmlMode
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Toggle HTML Source"
          >
            {htmlMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Visual</span>
              </>
            ) : (
              <>
                <CodeXml className="w-3.5 h-3.5" />
                <span>HTML</span>
              </>
            )}
          </button>
        </div>

        {/* Editor Body */}
        {htmlMode ? (
          <textarea
            value={rawHtml}
            onChange={handleRawHtmlChange}
            placeholder="<p>Paste or write custom HTML here...</p>"
            style={{ minHeight }}
            className="w-full p-4 font-mono text-xs text-slate-800 dark:text-slate-200 bg-slate-950/5 dark:bg-slate-950/40 focus:outline-none resize-y leading-relaxed"
          />
        ) : (
          <div className="relative cursor-text" onClick={() => editor?.commands.focus()}>
            <EditorContent editor={editor} />
            {editor && editor.isEmpty && (
              <div
                className="pointer-events-none absolute top-4 left-4 text-sm text-slate-400 dark:text-slate-500 select-none"
                style={{ userSelect: 'none' }}
              >
                {placeholder}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

