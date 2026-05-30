export interface OracleApp {
  /** stable id used in the /a/:id embed route */
  id: string
  /** short display name */
  label: string
  /** tiny uppercase kicker shown above the title */
  tagline: string
  /** one-line description for the launcher card */
  description: string
  /** full https URL of the deployed standalone app */
  url: string
  /** bare hostname for display */
  host: string
  /** emoji glyph */
  emoji: string
  /** per-app accent color (hex) */
  accent: string
  /** featured cards span two columns on large screens */
  featured?: boolean
}

export const APPS: OracleApp[] = [
  {
    id: 'studio',
    label: 'Studio',
    tagline: 'Dashboard',
    description: 'The main Oracle dashboard — search, traces, planets, sessions, plugins and more.',
    url: 'https://studio.buildwithoracle.com',
    host: 'studio.buildwithoracle.com',
    emoji: '🔮',
    accent: '#a78bfa',
    featured: true,
  },
  {
    id: 'vector',
    label: 'Vector',
    tagline: 'Playground',
    description: 'Semantic search playground — compare results across vector models side by side.',
    url: 'https://vector.buildwithoracle.com',
    host: 'vector.buildwithoracle.com',
    emoji: '🧭',
    accent: '#64b5f6',
  },
  {
    id: 'canvas',
    label: 'Canvas',
    tagline: 'Plugin host',
    description: '3D visualization canvas — planets, knowledge maps and Three.js plugin scenes.',
    url: 'https://canvas.buildwithoracle.com',
    host: 'canvas.buildwithoracle.com',
    emoji: '🎨',
    accent: '#f472b6',
  },
  {
    id: 'feed',
    label: 'Feed',
    tagline: 'Knowledge feed',
    description: 'The latest learnings, retros and documents as they land in the vault.',
    url: 'https://feed.buildwithoracle.com',
    host: 'feed.buildwithoracle.com',
    emoji: '📰',
    accent: '#4ade80',
  },
  {
    id: 'forum',
    label: 'Forum',
    tagline: 'Discussion',
    description: 'Threads and discussion across the Oracle knowledge base.',
    url: 'https://forum.buildwithoracle.com',
    host: 'forum.buildwithoracle.com',
    emoji: '💬',
    accent: '#fbbf24',
  },
  {
    id: 'schedule',
    label: 'Schedule',
    tagline: 'Calendar',
    description: 'Upcoming events and the Oracle schedule, rendered from markdown.',
    url: 'https://schedule.buildwithoracle.com',
    host: 'schedule.buildwithoracle.com',
    emoji: '📅',
    accent: '#22d3ee',
  },
  {
    id: 'indexer',
    label: 'Indexer',
    tagline: 'Configure & run',
    description: 'Configure adapters, models and data sources, then run indexing jobs.',
    url: 'https://indexer.buildwithoracle.com',
    host: 'indexer.buildwithoracle.com',
    emoji: '⚙️',
    accent: '#34d399',
  },
]
