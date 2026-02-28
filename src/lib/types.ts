import type { Locale } from '@/lib/i18n';

export type LocalizedText = Record<Locale, string>;

export type PortStatus = 'alpha' | 'beta' | 'live';

export type Port = {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  tags: string[];
  status: PortStatus;
  link: string;
  screenshot: string;
  techStack: string[];
  designIntent: LocalizedText;
};

export type NoteTopic = 'AI' | 'Clinical' | 'Books' | 'Thinking';

export type Note = {
  slug: string;
  topic: NoteTopic;
  date: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  sections: Record<Locale, string[]>;
  highlight: LocalizedText;
  quote: LocalizedText;
  sidenotes: Record<Locale, string[]>;
};

export type LifeEntry = {
  title: LocalizedText;
  note: LocalizedText;
};

export type LifeTimelineItem = {
  year: string;
  text: LocalizedText;
};

export type LifeModule = {
  cards: LifeEntry[];
  timeline: LifeTimelineItem[];
};
