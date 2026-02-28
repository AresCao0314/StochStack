import Link from 'next/link';
import type { Locale } from '@/lib/i18n';

export function Footer({ locale, imprint }: { locale: Locale; imprint: string }) {
  return (
    <footer className="mt-20 border-t border-ink/10 py-8">
      <div className="mx-auto grid max-w-7xl gap-4 px-5 text-sm md:grid-cols-3 md:px-8">
        <p>stochstack.com</p>
        <p className="text-center">随机栈 / StochStack</p>
        <Link href={`/${locale}/about`} className="justify-self-end glitch-link">
          {imprint}
        </Link>
      </div>
    </footer>
  );
}
