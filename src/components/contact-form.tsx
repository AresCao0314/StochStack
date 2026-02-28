'use client';

import { FormEvent, useState } from 'react';

type ContactFormProps = {
  labels: {
    name: string;
    email: string;
    message: string;
    submit: string;
    copied: string;
  };
};

export function ContactForm({ labels }: ContactFormProps) {
  const [tip, setTip] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = 'hello@stochstack.com';
    await navigator.clipboard.writeText(email);
    window.location.href = `mailto:${email}`;
    setTip(labels.copied);
  }

  return (
    <form onSubmit={onSubmit} className="noise-border space-y-4 rounded-lg p-5">
      <label className="block text-sm">
        {labels.name}
        <input
          aria-label={labels.name}
          required
          className="mt-1 w-full rounded border border-ink/20 bg-transparent px-3 py-2"
          name="name"
        />
      </label>
      <label className="block text-sm">
        {labels.email}
        <input
          aria-label={labels.email}
          type="email"
          required
          className="mt-1 w-full rounded border border-ink/20 bg-transparent px-3 py-2"
          name="email"
        />
      </label>
      <label className="block text-sm">
        {labels.message}
        <textarea
          aria-label={labels.message}
          required
          rows={4}
          className="mt-1 w-full rounded border border-ink/20 bg-transparent px-3 py-2"
          name="message"
        />
      </label>
      <button type="submit" aria-label={labels.submit} className="scanline rounded border border-ink/20 px-4 py-2 text-sm">
        {labels.submit}
      </button>
      {tip ? <p className="text-sm text-accent1">{tip}</p> : null}
    </form>
  );
}
