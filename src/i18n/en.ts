const en = {
  siteName: 'StochStack',
  slogan: 'Build prototypes like sampling signals from noise.',
  nav: {
    home: 'Home',
    prototypes: 'Prototypes',
    notes: 'Notes',
    life: 'Life',
    about: 'About',
    contact: 'Contact'
  },
  home: {
    heroTitle: 'StochStack',
    heroSubtitle: 'Signal-first experiments for ideas, systems, and human workflows.',
    cards: [
      { title: 'Prototypes', hint: '> open prototype' },
      { title: 'Notes', hint: '> read log' },
      { title: 'Life', hint: '> view signal' }
    ],
    portsTitle: 'Prototype Ports'
  },
  common: {
    filterByTag: 'Filter by tag',
    filterByStatus: 'Filter by status',
    all: 'All',
    alpha: 'alpha',
    beta: 'beta',
    live: 'live',
    readMore: 'Read more',
    visit: 'Visit',
    designIntent: 'Design Intent',
    timeline: 'Timeline'
  },
  prototypes: {
    title: 'Prototype Array',
    subtitle: 'Systems in motion, tested in the edge-space between concept and utility.'
  },
  notes: {
    title: 'Signal Logs',
    subtitle: 'Fragments, models, and editorial traces from ongoing work.',
    topics: ['AI', 'Clinical', 'Books', 'Thinking', 'Data Foundation', 'Responsible AI', 'Advanced AI'],
    topicLabels: {
      AI: 'AI',
      Clinical: 'Clinical',
      Books: 'Books',
      Thinking: 'Thinking',
      'Data Foundation': 'Data Foundation',
      'Responsible AI': 'Responsible AI',
      'Advanced AI': 'Advanced AI'
    },
    capture: {
      title: 'Quick Capture',
      subtitle: 'Drop raw notes from phone or web, then condense into usable bullets.',
      placeholder:
        'Write in English or Chinese. Example: meeting highlights, idea fragments, reading notes, clinical workflow observations...',
      summarize: 'Summarize',
      save: 'Save to local log',
      clear: 'Clear',
      copy: 'Copy bullets',
      history: 'Recent captures',
      empty: 'No local captures yet.',
      usingQwen: 'Summarized by Qwen',
      usingFallback: 'Summarized by local fallback',
      error: 'Summarization failed. Try again.',
      saved: 'Saved locally on this device.'
    }
  },
  life: {
    title: 'Life Index',
    subtitle: 'Fields outside the product surface that still shape the stack.',
    sections: {
      books: 'Books',
      tennis: 'Tennis',
      editing: 'Editing',
      films: 'Films',
      architecture: 'Architecture'
    }
  },
  about: {
    title: 'Stack of Intent',
    manifesto: 'Manifesto',
    now: 'Now',
    stack: 'Stack'
  },
  contact: {
    title: 'Open Channel',
    subtitle: 'No backend form yet. Send a line, trigger a thread.',
    name: 'Name',
    email: 'Email',
    message: 'Message',
    submit: 'Copy email and open mail',
    copied: 'Email copied. Mail client opening...'
  },
  console: {
    title: 'Stoch Console',
    next: 'Next',
    copy: 'Copy'
  },
  footer: {
    imprint: 'imprint'
  },
  signal: {
    title: 'Signal Poster Lab',
    subtitle: 'Seeded stochastic grid. Export as PNG.',
    regenerate: 'Regenerate',
    download: 'Download PNG'
  }
};

export default en;
