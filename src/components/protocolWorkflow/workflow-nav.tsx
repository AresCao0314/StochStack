import Link from 'next/link';

type Item = {
  href: string;
  label: string;
};

export function WorkflowNav({ items, current }: { items: Item[]; current: string }) {
  return (
    <nav className="noise-border rounded-lg p-3">
      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em]">
        {items.map((item) => {
          const active = item.href === current;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded border px-2 py-1 transition ${
                active
                  ? 'border-ink bg-ink text-base'
                  : 'border-ink/20 bg-white/60 text-ink hover:border-ink/60'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
