import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/footer';
import { StochConsole } from '@/components/stoch-console';
import { getConsoleQuotes } from '@/lib/content';
import { getDictionary, isLocale, locales, type Locale } from '@/lib/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) {
    return {};
  }

  const dict = getDictionary(params.locale);
  return {
    title: dict.siteName,
    description: dict.slogan,
    openGraph: {
      title: dict.siteName,
      description: dict.slogan
    }
  };
}

export default function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale = params.locale as Locale;
  const dict = getDictionary(locale);

  return (
    <div className="min-h-screen">
      <TopNav locale={locale} nav={dict.nav} />
      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">{children}</main>
      <Footer locale={locale} imprint={dict.footer.imprint} />
      <StochConsole
        locale={locale}
        title={dict.console.title}
        nextLabel={dict.console.next}
        copyLabel={dict.console.copy}
        quotes={getConsoleQuotes() as Record<Locale, string>[]}
      />
    </div>
  );
}
