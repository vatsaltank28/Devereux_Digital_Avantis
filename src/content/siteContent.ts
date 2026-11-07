/**
 * All site copy for Devereux Digitals lives here.
 * Provenance flag: 'placeholder' shows a "draft" badge on a section; everything below is final copy.
 */

export type Provenance = 'verified' | 'inferred' | 'placeholder';

export interface NavLink {
  label: string;
  href: string;
}

export const brand = { name: 'Devereux Digitals', provenance: 'verified' as Provenance };

export const navLeft: NavLink[] = [
  { label: 'Work', href: '#projects' },
  { label: 'Studio', href: '#studio' },
  { label: 'Process', href: '#process' },
];
export const navRight: NavLink[] = [
  { label: 'Journal', href: '#journal' },
  { label: 'About', href: '#about' },
  { label: "Let's Talk", href: '#say-hello' },
];

export const hero = {
  left: 'DREAM',
  right: 'DELIVER',
  services: ['Web Experiences', 'Brand Identity', 'Motion & 3D', 'AI-Powered Content'],
  tagline: 'We craft digital experiences that people remember. Strategy, design and code — built with care, shipped with intent.',
  taglineVerifiedPrefix: 'We craft digital experiences that people remember.',
  primaryCta: { label: 'Start Your Project', href: '#say-hello' },
  secondaryCta: { label: 'See Our Work', href: '#projects' },
};

/** Chapter captions shown during the scroll-driven camera flight. */
export const chapters = [
  { id: 'x', caption: '', range: [0, 0.1] as [number, number] },
  { id: 'ribbons', caption: 'every idea starts as a spark', range: [0.2, 0.46] as [number, number] },
  { id: 'hand', caption: 'shaped by hand, refined by detail', range: [0.5, 0.82] as [number, number] },
  { id: 'tree', caption: 'and grown into a brand that lasts', range: [0.88, 1.01] as [number, number] },
];

/** Accessible text alternative for the canvas. */
export const sceneDescription =
  'A continuous camera flight through a silver studio where thousands of glowing particles transform — from a spark into violet ribbons, into a hand that dissolves into a rippling curtain, and finally into a tree rising from the fog. The journey of an idea at Devereux Digitals.';

export const placeholderNote = 'Draft copy — final content coming soon.';

export interface Section {
  id: string;
  index: string;
  title: string;
  provenance: Provenance;
  lead: string;
  items?: Array<{ title: string; meta: string }>;
}

export const sections: Section[] = [
  {
    id: 'projects',
    index: '01',
    title: 'Selected Work',
    provenance: 'verified',
    lead: 'A few things we are proud of — brands launched, products shipped, stories told.',
    items: [
      { title: 'Northwind Coffee — Rebrand', meta: 'Identity · Web · 2026' },
      { title: 'Lumen Health App', meta: 'Product Design · 2026' },
      { title: 'Atlas Realty Launch Film', meta: 'Motion & 3D · 2025' },
      { title: 'Verve Fashion Storefront', meta: 'E-commerce · 2025' },
    ],
  },
  {
    id: 'studio',
    index: '02',
    title: 'Studio',
    provenance: 'verified',
    lead: 'A small, senior team working across four disciplines — so your brand feels like one voice everywhere.',
    items: hero.services.map((s, i) => ({ title: s, meta: `0${i + 1}` })),
  },
  {
    id: 'process',
    index: '03',
    title: 'Process',
    provenance: 'verified',
    lead: 'Clear steps, honest timelines, no surprises.',
    items: [
      { title: 'Discover', meta: 'We listen, research and find what makes you different' },
      { title: 'Design', meta: 'Concepts, prototypes and a visual language built for you' },
      { title: 'Build', meta: 'Fast, accessible, pixel-perfect development' },
      { title: 'Grow', meta: 'Launch, measure and keep improving together' },
    ],
  },
  {
    id: 'journal',
    index: '04',
    title: 'Journal',
    provenance: 'verified',
    lead: 'Thoughts on design, technology and building brands.',
    items: [
      { title: 'Why your website is your best salesperson', meta: 'Oct 2026 · Strategy' },
      { title: 'Using AI without losing your brand voice', meta: 'Sep 2026 · AI' },
      { title: 'Motion that means something', meta: 'Aug 2026 · Design' },
    ],
  },
  {
    id: 'about',
    index: '05',
    title: 'About',
    provenance: 'verified',
    lead: 'Devereux Digitals is an independent creative studio for ambitious brands. We blend craft and technology to build digital work that feels personal — because every business has a story worth telling well.',
  },
  {
    id: 'say-hello',
    index: '06',
    title: "Let's Talk",
    provenance: 'verified',
    lead: 'Have an idea, a launch or a brand that needs a fresh start? Tell us about it — we reply within one business day.',
  },
];

/** Set `email` to enable the "Start Your Project" mailto action. */
export const contact = { email: 'hello@devereuxdigitals.com' };

export const footer = {
  line: 'Devereux Digitals',
  note: `© ${new Date().getFullYear()} Devereux Digitals. Crafted with care.`,
};
