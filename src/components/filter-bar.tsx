'use client';

import { motion } from 'framer-motion';

type FilterBarProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function FilterBar({ label, options, value, onChange }: FilterBarProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.16em] text-ink/60">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              type="button"
              aria-label={`filter ${option}`}
              onClick={() => onChange(option)}
              className="relative rounded-full border border-ink/20 px-3 py-1 text-xs"
            >
              {active ? (
                <motion.span
                  layoutId={`active-${label}`}
                  className="absolute inset-0 -z-10 rounded-full bg-accent2/35"
                  transition={{ type: 'spring', damping: 20, stiffness: 250 }}
                />
              ) : null}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
