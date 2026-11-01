import MainLayout from "../components/layout/MainLayout";

const contactLinks = [
  { label: "Personal site", href: "https://michaelbonner.dev/" },
  { label: "GitHub", href: "https://github.com/michaelbonner" },
  { label: "Instagram", href: "https://www.instagram.com/michael__bonner" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/michaelbonner/" },
];

const Contact = () => (
  <MainLayout
    title="Contact Michael Bonner | Lazy Uncle"
    description="Get in touch with Michael Bonner, the creator of Lazy Uncle."
  >
    <main>
      <section className="bg-evergreen text-cream">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <p className="text-sm font-semibold tracking-[0.16em] text-cream/70 uppercase">
            Contact
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.06] text-balance sm:text-6xl">
            A note to the person behind Lazy Uncle.
          </h1>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 md:grid-cols-[2fr_3fr] md:gap-20 md:py-28 lg:px-12">
        <div>
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            Hi, I&rsquo;m Michael.
          </h2>
          <p className="mt-5 max-w-md text-lg/8 text-ink-soft">
            I made Lazy Uncle to make birthday remembering a little easier. You
            can find me through any of these places.
          </p>
        </div>
        <ul className="border-t border-rule" role="list">
          {contactLinks.map((link) => (
            <li key={link.label} className="border-b border-rule">
              <a
                href={link.href}
                className="flex items-center justify-between gap-4 py-5 font-display text-2xl text-ink hover:text-accent-deep focus-visible:outline-2 focus-visible:outline-accent"
              >
                {link.label}
                <span aria-hidden className="font-sans text-lg">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  </MainLayout>
);

export default Contact;
