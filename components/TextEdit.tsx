import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const buttonClassName = `py-1 px-2`;

  return (
    <div className="flex flex-wrap bg-white border">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${buttonClassName} ${
          editor.isActive("bold") ? "font-semibold" : ""
        }`}
      >
        bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${buttonClassName} ${
          editor.isActive("italic") ? "font-semibold" : ""
        }`}
      >
        italic
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`${buttonClassName} ${
          editor.isActive("strike") ? "font-semibold" : ""
        }`}
      >
        strike
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`${buttonClassName} ${
          editor.isActive("paragraph") ? "font-semibold" : ""
        }`}
      >
        paragraph
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${buttonClassName} ${
          editor.isActive("heading", { level: 1 }) ? "font-semibold" : ""
        }`}
      >
        h1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${buttonClassName} ${
          editor.isActive("heading", { level: 2 }) ? "font-semibold" : ""
        }`}
      >
        h2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${buttonClassName} ${
          editor.isActive("heading", { level: 3 }) ? "font-semibold" : ""
        }`}
      >
        h3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${buttonClassName} ${
          editor.isActive("bulletList") ? "font-semibold" : ""
        }`}
      >
        bullet list
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${buttonClassName} ${
          editor.isActive("orderedList") ? "font-semibold" : ""
        }`}
      >
        ordered list
      </button>

      <button
        className={buttonClassName}
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
      >
        undo
      </button>
      <button
        className={buttonClassName}
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
      >
        redo
      </button>
    </div>
  );
};

const TextEdit = ({
  content,
  setContent,
}: {
  content: string;
  // eslint-disable-next-line no-unused-vars
  setContent: (html: string) => void;
}) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class:
          "border border-gray-300 rounded bg-white min-w-full w-full py-2 px-4 prose focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
    },
  });

  return (
    <>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
};

export default TextEdit;
