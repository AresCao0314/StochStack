import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact-form';
import { getDictionary, type Locale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  return {
    title: dict.nav.contact,
    description: dict.contact.subtitle,
    openGraph: {
      title: `${dict.nav.contact} | StochStack`,
      description: dict.contact.subtitle
    }
  };
}

export default function ContactPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section className="space-y-4">
        <p className="section-title">contact</p>
        <h1 className="text-5xl font-bold md:text-7xl">{dict.contact.title}</h1>
        <p className="text-lg text-ink/75">{dict.contact.subtitle}</p>

        <div className="space-y-2 text-sm">
          <a href="mailto:hello@stochstack.com" className="glitch-link block">
            hello@stochstack.com
          </a>
          <a href="https://calendly.com/example" target="_blank" rel="noreferrer" className="glitch-link block">
            Open Calendly (placeholder)
          </a>
        </div>
      </section>

      <ContactForm labels={dict.contact} />
    </div>
  );
}
