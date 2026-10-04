import type { FunnelStage, FunnelStageDef, Post } from '../db/types';

/**
 * The path from stranger to repeat client. Each stage needs its own kind of
 * content; an empty stage is where people drop out.
 */
export const STAGES: FunnelStage[] = ['awareness', 'interest', 'decision', 'action', 'loyalty'];

export const STAGE_META: Record<FunnelStage, { label: string; question: string; content: string; kpi: string }> = {
  awareness: {
    label: 'Awareness',
    question: 'How do strangers find us?',
    content: 'Educational carousels, trend reels, WHAT IF concepts, collabs with local creators',
    kpi: 'Reach, views, shares',
  },
  interest: {
    label: 'Interest',
    question: 'Why would they follow and keep watching?',
    content: 'Portfolio Tuesday, process videos, designer spotlights, freebies',
    kpi: 'Follows, saves, profile visits',
  },
  decision: {
    label: 'Decision',
    question: 'Why choose us over another studio?',
    content: 'Before/after reveals, testimonials, case studies, pricing explainers, FAQs',
    kpi: 'DMs, link clicks',
  },
  action: {
    label: 'Action',
    question: 'What exactly should they do now?',
    content: 'One offer, one keyword (“DM LOGO”), limited slots, a deadline, a discovery call',
    kpi: 'Inquiries, booked calls, sales',
  },
  loyalty: {
    label: 'Loyalty',
    question: 'How do clients come back and bring friends?',
    content: 'Client love features, behind the scenes, referral perks, anniversary check-ins',
    kpi: 'Repeat clients, referrals, reviews',
  },
};

const s = (key: FunnelStage, goal: string, content: string, offer: string, cta: string, channel: string, kpi: string, target: number | null): FunnelStageDef => ({ key, goal, content, offer, cta, channel, kpi, target });

export interface FunnelTemplate {
  id: string;
  name: string;
  forClients: boolean;
  description: string;
  stages: FunnelStageDef[];
}

export const FUNNEL_TEMPLATES: FunnelTemplate[] = [
  {
    id: 'studio-leads',
    name: 'Design studio leads',
    forClients: false,
    description: 'JoshWorks’ own funnel: from a saved carousel to a booked branding project.',
    stages: [
      s('awareness', 'Get seen by business owners and orgs around Iloilo', 'Monday educational carousels, trend reels, WHAT IF concepts', '', 'Save this / share with a friend building a brand', 'Facebook, Instagram, TikTok', 'Reach and shares', 20000),
      s('interest', 'Turn viewers into followers', 'Portfolio Tuesday, designer spotlights, process timelapses, Freebie Friday', 'Freebie: font pairing guide or templates', 'Follow for weekly design tips', 'Instagram, Facebook', 'Follows and saves', 300),
      s('decision', 'Show we deliver', 'Before/after reveals, client testimonials, how we hand over logo files, pricing explainer', 'Free 10-minute brand check', 'DM “REBRAND”', 'Facebook, Instagram', 'DMs', 20),
      s('action', 'Book the project', 'Offer posts with one keyword (LOGO, MERCH, MOTION), limited monthly slots', 'Rate sheet and discovery call', 'DM “START” for the rate sheet', 'Messenger, Instagram DM', 'Inquiries → paid projects', 4),
      s('loyalty', 'Repeat work and referrals', 'Client love features, anniversary check-ins, referral perk', '₱500 off the next project for each referral', 'Tag a friend who needs a logo', 'Facebook, Messenger', 'Repeat clients and referrals', 2),
    ],
  },
  {
    id: 'merch-drop',
    name: 'Merch / Concept Drop',
    forClients: false,
    description: 'Show a concept, let people vote, then sell a limited run.',
    stages: [
      s('awareness', 'Make the concept travel', 'Concept reveal carousel (“Would you wear this?”), trend reel', '', 'Vote in the comments', 'TikTok, Instagram, Facebook', 'Shares and comments', 15000),
      s('interest', 'Build want', 'Mockups, sketch-to-print process, poll results', '', 'Turn on post notifications', 'Instagram Stories', 'Saves, poll votes', 200),
      s('decision', 'Make it real', 'Limited run announcement, size chart, early-bird price', 'Early-bird price for 48 hours', 'Reserve your size', 'Facebook, Instagram', 'Reservations', 40),
      s('action', 'Take orders', 'Pre-order form, countdown stories, last-call post', 'Pre-order only', 'DM “MERCH”', 'Messenger, Instagram DM', 'Pieces sold', 30),
      s('loyalty', 'Turn buyers into ambassadors', 'Repost buyers wearing it, next drop teaser', 'Early access to the next drop', 'Tag us when you wear it', 'Instagram, Facebook', 'Buyer posts and repeat buyers', 10),
    ],
  },
  {
    id: 'local-business',
    name: 'Local business (SMM client)',
    forClients: true,
    description: 'For cafés, shops and services around Iloilo: from a reel to a regular customer.',
    stages: [
      s('awareness', 'Get locals to notice', 'Short reels of the product being made or used, local trends, creator collabs, a small boost', '', 'Share with someone who’d love this', 'Facebook, TikTok, Instagram', 'Reach in the city', 30000),
      s('interest', 'Make them curious', 'Menu or catalogue carousels, behind the scenes, the owner’s face and story, FAQs', '', 'Save for your next visit', 'Instagram, Facebook', 'Saves and profile visits', 400),
      s('decision', 'Remove doubts', 'Reviews and testimonials, comparisons, prices clearly shown', 'Payday promo or bundle', 'Message us for today’s menu', 'Facebook, Messenger', 'Messages', 60),
      s('action', 'Get the order', 'Order-via-Messenger keyword, map pin, booking link, promo with a deadline', 'Promo code or freebie on first order', 'Comment “ORDER”', 'Messenger, Facebook', 'Orders and bookings', 30),
      s('loyalty', 'Make them regulars', 'Customer features, loyalty card, birthday perks, review requests', 'Loyalty card or 10th-order freebie', 'Leave us a review', 'Facebook, Google Maps', 'Repeat customers and reviews', 15),
    ],
  },
  {
    id: 'event-booth',
    name: 'Event / booth promo',
    forClients: false,
    description: 'For sticker and merch booths at events (pairs with JoshWorks POS).',
    stages: [
      s('awareness', 'Let people know we’ll be there', 'Event announcement, booth number, sneak peeks', '', 'Save the date', 'Facebook, Instagram', 'Reach', 8000),
      s('interest', 'Show the lineup', 'Product lineup carousel, bundle deals (e.g. 4 for ₱75), artist collabs', 'Bundle deals', 'Which one are you getting?', 'Instagram, Facebook', 'Saves and comments', 100),
      s('decision', 'Create urgency', 'Limited items, schedule, what sells out first', 'First-hour freebie', 'Come early', 'Stories', 'Story replies', 30),
      s('action', 'Bring them to the booth', '“See you at Booth X”, map, countdown stories', '', 'Find us at Booth X', 'Stories, Facebook', 'Visitors and sales', 100),
      s('loyalty', 'Keep them after the event', 'Thank-you post, buyer photos, online order link, next event teaser', 'Online reorder', 'Tag us in your sticker setup', 'Instagram, Facebook', 'Tags and reorders', 20),
    ],
  },
];

export const emptyStages = (): FunnelStageDef[] => STAGES.map((k) => s(k, '', '', '', '', '', STAGE_META[k].kpi, null));

/** Planned posts per stage for a funnel's campaign or client, and the stages with nothing in them. */
export function coverage(posts: Pick<Post, 'funnelStage' | 'deleted' | 'status'>[]): { counts: Record<FunnelStage, number>; empty: FunnelStage[] } {
  const counts = Object.fromEntries(STAGES.map((k) => [k, 0])) as Record<FunnelStage, number>;
  for (const p of posts) if (p.deleted !== 1 && p.funnelStage && p.status !== 'skipped') counts[p.funnelStage] += 1;
  return { counts, empty: STAGES.filter((k) => counts[k] === 0) };
}
