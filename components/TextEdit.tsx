import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  MdFormatListNumbered,
  MdOutlineFormatListBulleted,
} from "react-icons/md";
import { IoArrowUndo, IoArrowRedo } from "react-icons/io5";

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const buttonClassName = `py-1 px-2`;

  return (
    <div className="flex flex-wrap items-end bg-white border border-b-0 rounded-t pb-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${buttonClassName} ${
          editor.isActive("bold") ? "font-semibold" : ""
        } font-bold`}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${buttonClassName} ${
          editor.isActive("italic") ? "font-semibold" : ""
        } italic`}
      >
        i
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`${buttonClassName} ${
          editor.isActive("strike") ? "font-semibold" : ""
        } line-through`}
      >
        s
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
          editor.isActive("heading", { level: 1 }) ? "font-bold" : "font-medium"
        } text-2xl`}
      >
        h1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${buttonClassName} ${
          editor.isActive("heading", { level: 2 }) ? "font-bold" : "font-medium"
        } text-xl`}
      >
        h2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${buttonClassName} ${
          editor.isActive("heading", { level: 3 }) ? "font-bold" : "font-medium"
        } text-lg`}
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
        <MdOutlineFormatListBulleted />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${buttonClassName} ${
          editor.isActive("orderedList") ? "font-semibold" : ""
        }`}
      >
        <MdFormatListNumbered />
      </button>

      <button
        className={buttonClassName}
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
      >
        <IoArrowUndo />
      </button>
      <button
        className={buttonClassName}
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
      >
        <IoArrowRedo />
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
          "border border-gray-300 rounded-b bg-white min-w-full w-full py-2 px-4 prose focus:outline-none min-h-[200px]",
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
