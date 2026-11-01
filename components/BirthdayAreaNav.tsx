import Link from "next/link";

const destinations = [
  { href: "/birthdays", label: "Birthdays" },
  { href: "/birthdays/tools/sharing", label: "Sharing" },
  { href: "/birthdays/tools/settings", label: "Settings" },
  { href: "/birthdays/tools/import", label: "Import" },
];

export default function BirthdayAreaNav({
  currentPath,
}: {
  currentPath: string;
}) {
  return (
    <nav
      aria-label="Birthday tools"
      className="-mx-5 mb-7 overflow-x-auto border-b border-rule px-5 sm:mx-0 sm:px-0"
    >
      <div className="flex min-w-max items-center gap-1">
        {destinations.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={currentPath === href ? "page" : undefined}
            className="border-b-2 border-transparent px-3 py-3 text-sm text-ink-soft hover:text-ink aria-[current=page]:border-accent aria-[current=page]:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
