import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { IoArrowRedo, IoArrowUndo } from "react-icons/io5";
import {
  MdFormatListNumbered,
  MdOutlineFormatListBulleted,
} from "react-icons/md";

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const buttonClassName = `py-1 px-2`;

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-end rounded-t border bg-gray-100 px-2 pb-2">
      <div>
        <button
          aria-label="bold"
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${buttonClassName} ${
            editor.isActive("bold")
              ? "rounded-sm bg-white font-bold shadow-xs"
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
              ? "rounded-sm bg-white font-bold shadow-xs"
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
              ? "rounded-sm bg-white font-bold shadow-xs"
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
              ? "rounded-sm bg-white font-bold shadow-xs"
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
              ? "rounded-sm bg-white font-bold shadow-xs"
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
              ? "rounded-sm bg-white font-bold shadow-xs"
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
              ? "rounded-sm bg-white font-bold shadow-xs"
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
              ? "rounded-sm bg-white font-bold shadow-xs"
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
              ? "rounded-sm bg-white font-bold shadow-xs"
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
  setContent: (html: string) => void;
}) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class:
          "border border-t-0 border-gray-300 rounded-b bg-white min-w-full w-full py-2 px-4 prose focus:outline-hidden min-h-[200px]",
      },
    },
    immediatelyRender: false,
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
