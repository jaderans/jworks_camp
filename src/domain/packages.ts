import { toCents } from '../lib/money';
import type { Deliverable, Package, Syncable } from '../db/types';

export type SeedPackage = Omit<Package, keyof Syncable>;

const d = (label: string, qty: number, hours: number, role: string): Deliverable => ({ label, qty, hours, role });

const MID = 'Mid Designer';
const JR = 'Junior Designer';
const ADMIN = 'Admin / Coordination';
const OJT = 'Trainee / OJT';
const OWNER = 'Creative Director / Owner';
const SENIOR = 'Senior Designer';
const ILLU = 'Illustrator';

/**
 * Introductory SMM rates for a studio starting its SMM service (2026 Philippine
 * market: beginners ₱3–5K, intermediate ₱5–10K, experienced ₱10–25K a month).
 * Hours assume template-based production ("templatize what works"). Each one
 * shows its margin against your own hourly rates; raise them as results come in.
 */
export const SEED_PACKAGES: SeedPackage[] = [
  {
    kind: 'smm',
    name: 'Starter',
    tagline: 'A steady, good-looking feed for a small business.',
    price: toCents(4500),
    unit: 'month',
    platforms: ['facebook', 'instagram'],
    deliverables: [d('Static and carousel posts', 8, 0.75, MID), d('Captions, hashtags and scheduling', 8, 0.25, ADMIN), d('Monthly mini report', 1, 1, ADMIN), d('Client check-ins', 1, 1, ADMIN)],
    includes: ['Facebook + Instagram', '8 posts a month (static and carousels)', 'Captions and hashtags written per platform', 'Scheduling at the best local times', '2 revisions per post', '1-page monthly report'],
    revisionsPerPost: 2,
    minTermMonths: 3,
    service: 'smm',
    active: 1,
    sort: 0,
    notes: '',
  },
  {
    kind: 'smm',
    name: 'Growth',
    tagline: 'Adds reels, stories and replies so the page grows, not just posts.',
    price: toCents(7500),
    unit: 'month',
    platforms: ['facebook', 'instagram'],
    deliverables: [
      d('Static and carousel posts', 10, 0.75, MID),
      d('Short reels (template-based)', 2, 1.5, MID),
      d('Stories', 4, 0.25, JR),
      d('Captions, hashtags and scheduling', 12, 0.25, ADMIN),
      d('Community replies, 15 min, 3× a week', 13, 0.25, OJT),
      d('Monthly report with next steps', 1, 1.5, ADMIN),
    ],
    includes: ['Facebook + Instagram', '12 posts a month (10 static/carousel + 2 reels)', '4 stories a month', 'Captions, hashtags and scheduling', 'Comment and message replies 3× a week', 'Monthly report with what to do next', '2 revisions per post'],
    revisionsPerPost: 2,
    minTermMonths: 3,
    service: 'smm',
    active: 1,
    sort: 1,
    notes: '',
  },
  {
    kind: 'smm',
    name: 'Plus',
    tagline: 'Three platforms, motion and a monthly strategy call.',
    price: toCents(12000),
    unit: 'month',
    platforms: ['facebook', 'instagram', 'tiktok'],
    deliverables: [
      d('Static and carousel posts', 8, 0.75, MID),
      d('Reels / TikToks (template-based)', 6, 1.25, MID),
      d('Motion graphics on 2 reels', 2, 1, MID),
      d('Stories', 8, 0.25, JR),
      d('Captions, hashtags and scheduling', 14, 0.25, ADMIN),
      d('Community replies, 15 min every weekday', 22, 0.25, OJT),
      d('Monthly analytics report', 1, 2, ADMIN),
      d('Strategy call', 1, 1, OWNER),
    ],
    includes: [
      'Facebook + Instagram + TikTok',
      '14 posts a month (8 static/carousel + 6 reels/TikToks, 2 with motion graphics)',
      '8 stories a month',
      'Captions, hashtags and scheduling',
      'Comment and message replies every weekday',
      'Monthly analytics report and strategy call',
      'One promo campaign planned each month',
      '2 revisions per post',
    ],
    revisionsPerPost: 2,
    minTermMonths: 3,
    service: 'smm',
    active: 1,
    sort: 2,
    notes: '',
  },
  // ----- add-ons -----
  { kind: 'addon', name: 'Extra static post', tagline: '', price: toCents(450), unit: 'piece', platforms: [], deliverables: [d('Design', 1, 0.75, MID), d('Caption and scheduling', 1, 0.25, ADMIN)], includes: [], revisionsPerPost: 2, minTermMonths: 0, service: 'smm', active: 1, sort: 10, notes: '' },
  { kind: 'addon', name: 'Extra reel', tagline: '', price: toCents(1000), unit: 'piece', platforms: [], deliverables: [d('Edit', 1, 1.5, MID), d('Caption and scheduling', 1, 0.25, ADMIN)], includes: [], revisionsPerPost: 2, minTermMonths: 0, service: 'smm', active: 1, sort: 11, notes: '' },
  { kind: 'addon', name: 'Reel with motion graphics', tagline: '', price: toCents(1800), unit: 'piece', platforms: [], deliverables: [d('Motion edit', 1, 2.5, MID), d('Caption and scheduling', 1, 0.25, ADMIN)], includes: [], revisionsPerPost: 2, minTermMonths: 0, service: 'motion', active: 1, sort: 12, notes: '' },
  { kind: 'addon', name: 'Story set (5)', tagline: '', price: toCents(600), unit: 'piece', platforms: [], deliverables: [d('Stories', 5, 0.25, JR)], includes: [], revisionsPerPost: 1, minTermMonths: 0, service: 'smm', active: 1, sort: 13, notes: '' },
  { kind: 'addon', name: 'Ads management', tagline: 'Ad budget is paid by the client, directly to Meta.', price: toCents(2500), unit: 'month', platforms: ['facebook', 'instagram'], deliverables: [d('Setup, monitoring and report', 1, 4, MID)], includes: ['Boosted posts or one campaign', 'Weekly check and adjustments', 'Results in the monthly report'], revisionsPerPost: 0, minTermMonths: 1, service: 'smm', active: 1, sort: 14, notes: '' },
  { kind: 'addon', name: 'Rush (within 24 hours)', tagline: 'Added to one-off work.', price: 2500, unit: 'percent', platforms: [], deliverables: [], includes: [], revisionsPerPost: 0, minTermMonths: 0, service: '', active: 1, sort: 15, notes: 'Stored as percent × 100: 2500 = 25%.' },
  { kind: 'addon', name: 'Extra revision round', tagline: 'Per round beyond what is included.', price: 1500, unit: 'percent', platforms: [], deliverables: [], includes: [], revisionsPerPost: 0, minTermMonths: 0, service: '', active: 1, sort: 16, notes: 'Stored as percent × 100: 1500 = 15%.' },
  // ----- design services (starting prices) -----
  { kind: 'design', name: 'Logo design', tagline: '3 concepts, 2 revision rounds, all file formats.', price: toCents(6500), unit: 'project', platforms: [], deliverables: [d('Concept and direction', 1, 1, OWNER), d('Design and revisions', 1, 6, SENIOR)], includes: ['Brief and moodboard', '3 logo concepts', '2 revision rounds', 'Final files: AI, SVG, PNG, PDF'], revisionsPerPost: 2, minTermMonths: 0, service: 'branding', active: 1, sort: 20, notes: '' },
  { kind: 'design', name: 'Brand identity kit', tagline: 'Logo suite, colours, type and a mini brand guide.', price: toCents(18000), unit: 'project', platforms: [], deliverables: [d('Strategy and direction', 1, 3, OWNER), d('Identity design', 1, 16, SENIOR), d('Brand guide layout', 1, 4, MID)], includes: ['Logo suite (primary, secondary, icon)', 'Colour palette and typography', 'Mini brand guide (PDF)', 'Social media profile kit'], revisionsPerPost: 2, minTermMonths: 0, service: 'branding', active: 1, sort: 21, notes: '' },
  { kind: 'design', name: 'Packaging or label design', tagline: 'One product (SKU), print-ready.', price: toCents(7500), unit: 'project', platforms: [], deliverables: [d('Direction', 1, 1, OWNER), d('Design and print prep', 1, 8, SENIOR)], includes: ['Dieline layout', '2 concepts', 'Print-ready files'], revisionsPerPost: 2, minTermMonths: 0, service: 'packaging', active: 1, sort: 22, notes: '' },
  { kind: 'design', name: 'Shirt / merch design', tagline: 'One design, print-ready.', price: toCents(2500), unit: 'project', platforms: [], deliverables: [d('Design', 1, 4, MID), d('Review', 1, 0.5, OWNER)], includes: ['1 design, front or back', 'Mockup', 'Print-ready file'], revisionsPerPost: 2, minTermMonths: 0, service: 'merch', active: 1, sort: 23, notes: '' },
  { kind: 'design', name: 'Sticker design', tagline: 'Per sticker, cut-ready.', price: toCents(500), unit: 'piece', platforms: [], deliverables: [d('Illustration', 1, 0.75, ILLU)], includes: ['Cut-ready file'], revisionsPerPost: 1, minTermMonths: 0, service: 'stickers', active: 1, sort: 24, notes: '' },
  { kind: 'design', name: 'Sticker pack (5 designs)', tagline: 'A matching set of five.', price: toCents(2400), unit: 'project', platforms: [], deliverables: [d('Illustration', 5, 0.7, ILLU)], includes: ['5 matching designs', 'Cut-ready files'], revisionsPerPost: 1, minTermMonths: 0, service: 'stickers', active: 1, sort: 25, notes: '' },
  { kind: 'design', name: 'Custom illustration', tagline: 'One spot illustration.', price: toCents(3500), unit: 'project', platforms: [], deliverables: [d('Illustration', 1, 5, ILLU)], includes: ['Sketch approval', 'Final artwork'], revisionsPerPost: 2, minTermMonths: 0, service: 'illustration', active: 1, sort: 26, notes: '' },
  { kind: 'design', name: 'Mascot / character design', tagline: 'With a turnaround and 3 expressions.', price: toCents(12000), unit: 'project', platforms: [], deliverables: [d('Character design', 1, 16, ILLU), d('Direction', 1, 1, OWNER)], includes: ['Concept sketches', 'Turnaround (front, side, back)', '3 expressions', 'Usage sheet'], revisionsPerPost: 2, minTermMonths: 0, service: 'illustration', active: 1, sort: 27, notes: '' },
  { kind: 'design', name: 'Logo animation', tagline: '5–8 second animated logo.', price: toCents(4000), unit: 'project', platforms: [], deliverables: [d('Animation', 1, 6, MID)], includes: ['Animated logo (MP4 + GIF)', 'Vertical and square versions'], revisionsPerPost: 2, minTermMonths: 0, service: 'motion', active: 1, sort: 28, notes: '' },
  { kind: 'design', name: 'Motion graphic intro', tagline: '15–30 seconds.', price: toCents(12000), unit: 'project', platforms: [], deliverables: [d('Storyboard and animation', 1, 20, MID), d('Direction', 1, 2, OWNER)], includes: ['Storyboard', 'Animation with sound', '2 revision rounds'], revisionsPerPost: 2, minTermMonths: 0, service: 'motion', active: 1, sort: 29, notes: '' },
  { kind: 'design', name: 'Landing page', tagline: 'One mobile-first page that converts.', price: toCents(14000), unit: 'project', platforms: [], deliverables: [d('Design and build', 1, 16, SENIOR), d('Direction', 1, 2, OWNER)], includes: ['Copy structure', 'Mobile-first design', 'Contact or order form', 'Basic SEO'], revisionsPerPost: 2, minTermMonths: 0, service: 'web', active: 1, sort: 30, notes: '' },
  { kind: 'design', name: 'Website (up to 5 pages)', tagline: 'For businesses ready for a full site.', price: toCents(32000), unit: 'project', platforms: [], deliverables: [d('Design and build', 1, 40, SENIOR), d('Direction', 1, 4, OWNER)], includes: ['Up to 5 pages', 'Mobile-first design', 'Contact form and map', 'Basic SEO', '1 month of fixes'], revisionsPerPost: 2, minTermMonths: 0, service: 'web', active: 1, sort: 31, notes: '' },
];

/** The introductory offer for the first SMM clients. */
export const FOUNDING_OFFER = { pct: 10, months: 3, label: 'Founding client: 10% off the first 3 months (in exchange for a testimonial and a case study)' };

export const UNIT_LABEL: Record<Package['unit'], string> = {
  month: '/ month',
  project: '/ project',
  piece: '/ piece',
  hour: '/ hour',
  percent: '',
};
