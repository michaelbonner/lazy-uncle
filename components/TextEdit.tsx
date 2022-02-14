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
    <div className="flex flex-wrap items-end bg-gray-100 px-2 rounded-t pb-2 sticky top-0 z-10 border">
      <div>
        <button
          aria-label="bold"
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${buttonClassName} ${
            editor.isActive("bold")
              ? "font-bold bg-white rounded shadow-sm"
              : ""
          } font-bold`}
        >
          B
        </button>
        <button
          aria-label="italic"
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${buttonClassName} ${
            editor.isActive("italic")
              ? "font-bold bg-white rounded shadow-sm"
              : ""
          } italic`}
        >
          i
        </button>
        <button
          aria-label="strike through"
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`${buttonClassName} ${
            editor.isActive("strike")
              ? "font-bold bg-white rounded shadow-sm"
              : ""
          } line-through`}
        >
          s
        </button>
      </div>
      <div>
        <button
          aria-label="paragraph"
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`${buttonClassName} ${
            editor.isActive("paragraph")
              ? "font-bold bg-white rounded shadow-sm"
              : ""
          }`}
        >
          paragraph
        </button>
        <button
          aria-label="heading 1"
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`${buttonClassName} ${
            editor.isActive("heading", { level: 1 })
              ? "font-bold bg-white rounded shadow-sm"
              : "font-normal"
          } text-2xl`}
        >
          h1
        </button>
        <button
          aria-label="heading 2"
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`${buttonClassName} ${
            editor.isActive("heading", { level: 2 })
              ? "font-bold bg-white rounded shadow-sm"
              : "font-normal"
          } text-xl`}
        >
          h2
        </button>
        <button
          aria-label="heading 3"
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`${buttonClassName} ${
            editor.isActive("heading", { level: 3 })
              ? "font-bold bg-white rounded shadow-sm"
              : "font-normal"
          } text-lg`}
        >
          h3
        </button>
      </div>

      <div>
        <button
          aria-label="bullet list"
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${buttonClassName} ${
            editor.isActive("bulletList")
              ? "font-bold bg-white rounded shadow-sm"
              : ""
          }`}
        >
          <MdOutlineFormatListBulleted />
        </button>

        <button
          aria-label="ordered list"
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${buttonClassName} ${
            editor.isActive("orderedList")
              ? "font-bold bg-white rounded shadow-sm"
              : ""
          }`}
        >
          <MdFormatListNumbered />
        </button>
      </div>

      <div>
        <button
          aria-label="undo"
          className={buttonClassName}
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <IoArrowUndo />
        </button>
        <button
          aria-label="redo"
          className={buttonClassName}
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <IoArrowRedo />
        </button>
      </div>
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
          "border border-t-0 border-gray-300 rounded-b bg-white min-w-full w-full py-2 px-4 prose focus:outline-none min-h-[200px]",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
    },
  });

  return (
    <div>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TextEdit;
