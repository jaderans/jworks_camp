import { addDays, mondayOf } from '../lib/time';
import { isBreak } from './calendar';
import type { CadenceSettings, CampaignGoal, FunnelStage, Kpi, Persona, ServiceKey } from '../db/types';

/**
 * Ready-made campaigns for each JoshWorks service and for the seasons that
 * bring work in. Each one is a short sequence of posts across two to five weeks,
 * placed on the weekly themes, with an offer, a DM keyword and targets.
 */

export interface TemplatePost {
  /** Week from the start (0 = the first week). */
  week: number;
  /** 1 = Monday … 5 = Friday. */
  dow: number;
  title: string;
  format: string;
  stage: FunnelStage;
  brief: string;
  series?: string;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  group: 'Services' | 'Seasons' | 'SMM' | 'For clients';
  service: ServiceKey | '';
  goal: CampaignGoal;
  seasonId?: string;
  description: string;
  offer: string;
  keyMessage: string;
  ctaKeyword: string;
  leadMagnet: string;
  kpis: Kpi[];
  audience: Persona;
  funnelTemplateId: string;
  posts: TemplatePost[];
}

const persona = (name: string, who: string, pains: string, wants: string, objections: string, whereTheyAre: string, triggers: string): Persona => ({ name, who, pains, wants, objections, whereTheyAre, triggers });

const SMALL_BIZ = persona(
  'Iloilo small-business owner',
  'Runs a café, shop or service in Iloilo; 25–45; does their own posting',
  'Looks homemade next to competitors; no time; unsure what to post',
  'A brand people remember and trust; more messages and orders',
  '“Designers are expensive”, “I can do it in Canva”, “Will it actually bring sales?”',
  'Facebook groups, Instagram, TikTok, local business pages',
  'Opening a branch, new menu, rebrand, peak seasons, payday',
);

const ORG_OFFICER = persona(
  'Student org or class officer',
  'College or senior-high officer ordering shirts, lanyards or logos for the group',
  'Tight deadlines, many opinions, small budget, fear of a bad print',
  'A design everyone likes, delivered on time, at a group price',
  '“Can you do it by next week?”, “Is there a student rate?”',
  'Facebook, Messenger group chats, TikTok',
  'Intrams, foundation days, graduation, org week, new school year',
);

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'rebrand',
    name: 'Brand check month',
    group: 'Services',
    service: 'branding',
    goal: 'leads',
    description: 'Educate on what a brand is, show proof, then open a few free brand-check slots.',
    offer: 'Free 10-minute brand check (3 slots this month)',
    keyMessage: 'A logo is not a brand; we build systems people remember.',
    ctaKeyword: 'REBRAND',
    leadMagnet: 'Brand health checklist (PDF)',
    kpis: [{ metric: 'reach', target: 15000 }, { metric: 'saves', target: 120 }, { metric: 'leads', target: 10 }],
    audience: SMALL_BIZ,
    funnelTemplateId: 'studio-leads',
    posts: [
      { week: 0, dow: 1, title: '5 Signs Your Brand Needs a Rebrand', format: 'Carousel', stage: 'awareness', brief: 'Checklist format. Last slide: “Spotted 2 or more? DM REBRAND for a free brand check.”' },
      { week: 0, dow: 2, title: 'Before & After: a client rebrand', format: 'Carousel', stage: 'decision', brief: 'Old vs new, what changed and why. Ask the client’s permission.' },
      { week: 0, dow: 4, title: 'Building a brand system, not just a logo', format: 'Carousel', stage: 'interest', brief: 'Logo suite, colours, type, usage. Designer spotlight.' },
      { week: 0, dow: 5, title: 'Client Love: what changed after the rebrand', format: 'Single image', stage: 'decision', brief: 'Testimonial quote card plus one result.' },
      { week: 1, dow: 1, title: 'Logo vs Brand vs Branding', format: 'Carousel', stage: 'awareness', brief: 'Logo = your face, brand = your reputation, branding = how you show up.' },
      { week: 1, dow: 2, title: 'Free brand check: 3 slots this month', format: 'Single image', stage: 'action', brief: 'One offer, one keyword: DM REBRAND.' },
      { week: 1, dow: 5, title: 'Last call: brand check slots', format: 'Story', stage: 'action', brief: 'Countdown sticker; reshare the offer post.' },
    ],
  },
  {
    id: 'merch-drop',
    name: 'Concept Drop: vote, then pre-order',
    group: 'Services',
    service: 'merch',
    goal: 'sales',
    description: 'Show an original shirt concept, let followers vote, sell a limited pre-order run.',
    offer: 'Limited run, pre-order only, early-bird price for 48 hours',
    keyMessage: 'Designed in Iloilo, printed only if you want it.',
    ctaKeyword: 'MERCH',
    leadMagnet: '',
    kpis: [{ metric: 'shares', target: 100 }, { metric: 'comments', target: 80 }, { metric: 'sales', target: 30 }],
    audience: ORG_OFFICER,
    funnelTemplateId: 'merch-drop',
    posts: [
      { week: 0, dow: 2, title: 'CONCEPT DROP: would you wear this?', format: 'Carousel', stage: 'awareness', brief: 'Moodboard → sketch → mockup. Ask people to vote in the comments.', series: 'Concept Drop' },
      { week: 0, dow: 5, title: 'BTS: from sketch to mockup', format: 'Reel', stage: 'interest', brief: 'Timelapse; show faces and hands.' },
      { week: 1, dow: 1, title: 'How to design a shirt people actually wear', format: 'Carousel', stage: 'awareness', brief: 'Placement, print size, colours, fabric.' },
      { week: 1, dow: 2, title: 'It’s happening: limited run + sizes', format: 'Carousel', stage: 'decision', brief: 'Size chart, price, early-bird window.' },
      { week: 1, dow: 4, title: 'Designer spotlight: designing merch', format: 'Reel', stage: 'interest', brief: 'The designer explains one decision.' },
      { week: 2, dow: 2, title: 'Pre-orders open: DM MERCH', format: 'Single image', stage: 'action', brief: 'Deadline and payment options.' },
      { week: 2, dow: 5, title: 'Last 48 hours to pre-order', format: 'Story', stage: 'action', brief: 'Countdown sticker.' },
      { week: 4, dow: 5, title: 'Spotted: you wearing the drop', format: 'Carousel', stage: 'loyalty', brief: 'Repost buyers (with permission); tease the next drop.' },
    ],
  },
  {
    id: 'sticker-pack',
    name: 'Sticker pack launch',
    group: 'Services',
    service: 'stickers',
    goal: 'sales',
    description: 'Tease, reveal and sell a sticker pack online and at the next booth.',
    offer: 'Bundle deal (e.g. 4 for ₱75) online and at the booth',
    keyMessage: 'Stickers drawn in-house, cut to last.',
    ctaKeyword: 'STICKERS',
    leadMagnet: '',
    kpis: [{ metric: 'views', target: 20000 }, { metric: 'sales', target: 50 }],
    audience: persona('Sticker collector', 'Students and young professionals, 16–28, who decorate laptops, tumblers and planners', 'Generic designs, stickers that fade or peel', 'Cute, local, durable stickers', '“Is it waterproof?”, “Shipping fee?”', 'TikTok, Instagram, Facebook groups', 'Payday, new semester, gift giving, events'),
    funnelTemplateId: 'event-booth',
    posts: [
      { week: 0, dow: 5, title: 'Sneak peek: new sticker pack', format: 'Reel', stage: 'awareness', brief: 'Peel-and-stick ASMR; no prices yet.' },
      { week: 1, dow: 1, title: 'Vinyl vs paper vs holo: which sticker to order?', format: 'Carousel', stage: 'awareness', brief: 'Durability, finish, best use, price range.' },
      { week: 1, dow: 2, title: 'The full pack + bundle deal', format: 'Carousel', stage: 'decision', brief: 'Every design, the bundle price, where to buy.' },
      { week: 1, dow: 4, title: 'From doodle to die-cut', format: 'Reel', stage: 'interest', brief: 'Illustrator process video.' },
      { week: 2, dow: 2, title: 'Order now or find us at the booth', format: 'Single image', stage: 'action', brief: 'DM keyword + event booth number.' },
      { week: 3, dow: 5, title: 'Sticker spotted: your setups', format: 'Carousel', stage: 'loyalty', brief: 'Customer photos (with permission).' },
    ],
  },
  {
    id: 'packaging',
    name: 'Packaging glow-up',
    group: 'Services',
    service: 'packaging',
    goal: 'leads',
    description: 'Show what better packaging does for small food and product brands.',
    offer: 'Packaging slots this month; a free label review for the first 5 who message',
    keyMessage: 'Your packaging is your silent salesperson.',
    ctaKeyword: 'PACK',
    leadMagnet: 'Label checklist',
    kpis: [{ metric: 'saves', target: 100 }, { metric: 'leads', target: 8 }],
    audience: persona('Food or product maker', 'Pasalubong, bakery, coffee or skincare seller in Western Visayas', 'Plain labels; looks unprofessional on shelves and online', 'Packaging that sells in stores and on Facebook', '“Printing is expensive”, “I only need a sticker label”', 'Facebook, Instagram, local trade fairs', 'Trade fairs, new product, getting into stores'),
    funnelTemplateId: 'studio-leads',
    posts: [
      { week: 0, dow: 2, title: 'WHAT IF: we redesigned a local pasalubong pack', format: 'Carousel', stage: 'awareness', brief: 'Unofficial concept; add the disclaimer. Explain each decision.', series: 'WHAT IF' },
      { week: 0, dow: 4, title: 'Packaging that sells: 5 rules', format: 'Carousel', stage: 'interest', brief: 'Shelf impact, hierarchy, honest photos, colour, information.' },
      { week: 1, dow: 1, title: 'What your product label needs', format: 'Carousel', stage: 'awareness', brief: 'Product name, net content, ingredients, best-before, maker’s name and address. Remind them to check FDA rules for their product.' },
      { week: 1, dow: 2, title: 'Before & after: client packaging', format: 'Carousel', stage: 'decision', brief: 'Show the shelf or flat lay.' },
      { week: 2, dow: 2, title: 'Packaging slots open: DM PACK', format: 'Single image', stage: 'action', brief: 'Free label review for the first 5.' },
    ],
  },
  {
    id: 'mascot',
    name: 'WHAT IF mascot series',
    group: 'Services',
    service: 'illustration',
    goal: 'awareness',
    description: 'Shareable mascot concepts for things people already love, then open commissions.',
    offer: 'Mascot commission slots',
    keyMessage: 'Characters make brands lovable.',
    ctaKeyword: 'MASCOT',
    leadMagnet: '',
    kpis: [{ metric: 'shares', target: 150 }, { metric: 'follows', target: 100 }, { metric: 'leads', target: 5 }],
    audience: SMALL_BIZ,
    funnelTemplateId: 'studio-leads',
    posts: [
      { week: 0, dow: 1, title: 'Mascots vs logos: when does a brand need a character?', format: 'Carousel', stage: 'awareness', brief: 'When a mascot adds value; famous examples; pitfalls.' },
      { week: 0, dow: 2, title: 'WHAT IF: a local favourite had a mascot', format: 'Carousel', stage: 'awareness', brief: 'Unofficial concept with disclaimer; shape-language notes.', series: 'WHAT IF' },
      { week: 1, dow: 4, title: 'Shape language and expressions', format: 'Reel', stage: 'interest', brief: 'Illustrator spotlight.' },
      { week: 1, dow: 5, title: 'Vote: whose mascot should we design next?', format: 'Story', stage: 'interest', brief: 'Poll sticker; repost results.' },
      { week: 2, dow: 2, title: 'Commission slots: DM MASCOT', format: 'Single image', stage: 'action', brief: 'Turnaround, expressions, price range.' },
    ],
  },
  {
    id: 'motion',
    name: 'Bring your logo to life',
    group: 'Services',
    service: 'motion',
    goal: 'leads',
    description: 'Show what motion adds and sell logo animations as an easy upgrade.',
    offer: 'Logo animation for your reels and intros',
    keyMessage: 'Motion stops the scroll.',
    ctaKeyword: 'MOTION',
    leadMagnet: '',
    kpis: [{ metric: 'views', target: 25000 }, { metric: 'leads', target: 6 }],
    audience: SMALL_BIZ,
    funnelTemplateId: 'studio-leads',
    posts: [
      { week: 0, dow: 1, title: 'Static vs animated: why motion stops the scroll', format: 'Reel', stage: 'awareness', brief: 'Side by side; same design.' },
      { week: 0, dow: 4, title: 'Easing and timing: what makes motion feel good', format: 'Reel', stage: 'interest', brief: 'Robotic vs eased motion.' },
      { week: 1, dow: 2, title: 'Logo reveal for a client', format: 'Reel', stage: 'decision', brief: 'Keyframes to final.' },
      { week: 1, dow: 5, title: 'Add motion to your logo: DM MOTION', format: 'Single image', stage: 'action', brief: 'Price range and turnaround.' },
    ],
  },
  {
    id: 'website',
    name: 'Website that converts',
    group: 'Services',
    service: 'web',
    goal: 'leads',
    description: 'Teach what makes a page convert and offer a quick website check.',
    offer: 'Free 5-minute website check',
    keyMessage: 'A website should bring messages, not just look nice.',
    ctaKeyword: 'SITE',
    leadMagnet: 'Landing page checklist',
    kpis: [{ metric: 'saves', target: 80 }, { metric: 'leads', target: 6 }],
    audience: SMALL_BIZ,
    funnelTemplateId: 'studio-leads',
    posts: [
      { week: 0, dow: 1, title: 'Landing pages that convert: the 6 sections', format: 'Carousel', stage: 'awareness', brief: 'Hero, proof, offer, how it works, FAQ, CTA.' },
      { week: 0, dow: 4, title: 'Designing for thumbs: mobile first', format: 'Carousel', stage: 'interest', brief: 'Tap targets, readable type, fast pages.' },
      { week: 1, dow: 2, title: 'Website redesign: before & after', format: 'Carousel', stage: 'decision', brief: 'What changed and why.' },
      { week: 1, dow: 5, title: 'Free 5-minute website check: DM SITE', format: 'Single image', stage: 'action', brief: 'Limited to 5 a week.' },
    ],
  },
  {
    id: 'smm-launch',
    name: 'Launch: JoshWorks now manages social media',
    group: 'SMM',
    service: 'smm',
    goal: 'leads',
    description: 'Announce the SMM service and fill the first founding-client slots.',
    offer: 'Founding clients: 10% off the first 3 months (3 slots)',
    keyMessage: 'Your page, designed and run by a design studio.',
    ctaKeyword: 'SOCIAL',
    leadMagnet: 'Free page review',
    kpis: [{ metric: 'reach', target: 15000 }, { metric: 'leads', target: 10 }, { metric: 'sales', target: 3 }],
    audience: SMALL_BIZ,
    funnelTemplateId: 'local-business',
    posts: [
      { week: 0, dow: 2, title: 'We now manage social media for local brands', format: 'Carousel', stage: 'awareness', brief: 'What’s included, who it’s for, the three packages.' },
      { week: 0, dow: 4, title: 'What a month of SMM with us looks like', format: 'Carousel', stage: 'interest', brief: 'Discovery call → strategy → content → approval → posting → report.' },
      { week: 0, dow: 5, title: 'Founding clients: 3 slots at 10% off', format: 'Single image', stage: 'action', brief: 'In exchange for a testimonial and a case study.' },
      { week: 1, dow: 1, title: 'Why posting every day isn’t the answer', format: 'Carousel', stage: 'awareness', brief: 'Consistency, quality and the right content per funnel stage.' },
      { week: 1, dow: 2, title: 'Case study: how we run our own page', format: 'Carousel', stage: 'decision', brief: 'Our planner, themes and best results (saves and shares).' },
      { week: 1, dow: 5, title: 'Last founding slots: DM SOCIAL', format: 'Story', stage: 'action', brief: 'Countdown sticker; link to the packages post.' },
    ],
  },
  {
    id: 'paskua',
    name: 'Paskua holiday merch and giveaways',
    group: 'Seasons',
    service: 'merch',
    goal: 'sales',
    seasonId: 'christmas',
    description: 'Holiday merch and corporate giveaways; post early so orders can be made in time.',
    offer: 'Holiday merch and corporate giveaway packages (order by early December)',
    keyMessage: 'Gifts people actually keep, designed in Iloilo.',
    ctaKeyword: 'GIFTS',
    leadMagnet: 'Free Christmas social media templates',
    kpis: [{ metric: 'leads', target: 12 }, { metric: 'sales', target: 5 }],
    audience: persona('Office or org buying gifts', 'HR, admin or org officers buying giveaways for 20–200 people', 'Last-minute orders, boring generic gifts', 'Branded gifts that feel personal, on time and on budget', '“Minimum order?”, “Can it arrive before the party?”', 'Facebook, Messenger, LinkedIn', 'Christmas parties, year-end events, client gifts'),
    funnelTemplateId: 'merch-drop',
    posts: [
      { week: 0, dow: 2, title: 'CONCEPT DROP: Paskua sa Iloilo holiday tee', format: 'Carousel', stage: 'awareness', brief: 'Christmas concept; CTA for company and org orders.', series: 'Concept Drop' },
      { week: 0, dow: 5, title: 'Freebie Friday: Christmas social media templates', format: 'Single image', stage: 'interest', brief: 'Editable templates; grows saves and follows.' },
      { week: 1, dow: 1, title: 'Corporate giveaways people keep: 6 ideas', format: 'Carousel', stage: 'awareness', brief: 'Tees, tumblers, sticker sets, planners, tote bags, illustrated cards.' },
      { week: 1, dow: 2, title: 'Order deadline for holiday merch', format: 'Single image', stage: 'action', brief: 'State the last order date clearly.' },
      { week: 1, dow: 4, title: 'Animated greetings for your brand', format: 'Reel', stage: 'interest', brief: 'Static card → animated version; upsell motion.' },
      { week: 2, dow: 5, title: 'Client love: holiday orders delivered', format: 'Carousel', stage: 'loyalty', brief: 'Photos of delivered orders (with permission).' },
    ],
  },
  {
    id: 'dinagyang',
    name: 'Dinagyang pride drop',
    group: 'Seasons',
    service: 'illustration',
    goal: 'awareness',
    seasonId: 'dinagyang',
    description: 'Festival concepts and merch in the weeks before Dinagyang (4th Sunday of January).',
    offer: 'Festival sticker pack and tee, pre-order',
    keyMessage: 'Proud of Iloilo, made in Iloilo.',
    ctaKeyword: 'DINAGYANG',
    leadMagnet: '',
    kpis: [{ metric: 'shares', target: 200 }, { metric: 'sales', target: 40 }],
    audience: persona('Proud Ilonggo', 'Locals and balikbayans celebrating the festival', 'Generic festival merch', 'Something original and shareable', '“Will it arrive before the festival?”', 'Facebook, TikTok', 'Festival week, homecoming'),
    funnelTemplateId: 'merch-drop',
    posts: [
      { week: 0, dow: 2, title: 'WHAT IF: Dinagyang had an official mascot', format: 'Carousel', stage: 'awareness', brief: 'Unofficial fan concept (say so); shape-language explanation; respect the culture it comes from.', series: 'WHAT IF' },
      { week: 0, dow: 5, title: 'Festival sticker pack: sneak peek', format: 'Reel', stage: 'interest', brief: 'Peel-and-stick reel.' },
      { week: 1, dow: 2, title: 'Dinagyang tee + stickers: pre-order', format: 'Carousel', stage: 'action', brief: 'Deadline before the festival.' },
      { week: 1, dow: 4, title: 'Designing festival art with respect', format: 'Carousel', stage: 'interest', brief: 'How we research references and avoid stereotypes.' },
    ],
  },
  {
    id: 'graduation',
    name: 'Batch shirts and grad merch',
    group: 'Seasons',
    service: 'merch',
    goal: 'leads',
    seasonId: 'graduation',
    description: 'Reach class officers before they order batch shirts.',
    offer: 'Batch shirt design + group pricing',
    keyMessage: 'A batch shirt the whole class wants to wear again.',
    ctaKeyword: 'BATCH',
    leadMagnet: '',
    kpis: [{ metric: 'leads', target: 10 }, { metric: 'sales', target: 4 }],
    audience: ORG_OFFICER,
    funnelTemplateId: 'merch-drop',
    posts: [
      { week: 0, dow: 1, title: 'How to pick a batch shirt design everyone likes', format: 'Carousel', stage: 'awareness', brief: 'Poll the class, limit colours, think about print cost.' },
      { week: 0, dow: 2, title: 'Batch shirt concepts', format: 'Carousel', stage: 'decision', brief: 'Three concepts with mockups.' },
      { week: 1, dow: 2, title: 'Class officers: DM BATCH for a quote', format: 'Single image', stage: 'action', brief: 'Turnaround time and group pricing.' },
    ],
  },
  {
    id: 'intrams',
    name: 'Intramurals team shirts',
    group: 'Seasons',
    service: 'merch',
    goal: 'leads',
    seasonId: 'intrams',
    description: 'Team shirts and sports-fest identities for schools and orgs.',
    offer: 'Team shirt design + group pricing',
    keyMessage: 'Win the parade before the games start.',
    ctaKeyword: 'TEAM',
    leadMagnet: '',
    kpis: [{ metric: 'leads', target: 10 }, { metric: 'sales', target: 4 }],
    audience: ORG_OFFICER,
    funnelTemplateId: 'merch-drop',
    posts: [
      { week: 0, dow: 2, title: 'CONCEPT DROP: intrams team shirt', format: 'Carousel', stage: 'awareness', brief: 'Original concept; CTA for org and team quotes.', series: 'Concept Drop' },
      { week: 0, dow: 4, title: 'Designing team shirts that read from the bleachers', format: 'Carousel', stage: 'interest', brief: 'Big shapes, bold numbers, two colours.' },
      { week: 1, dow: 2, title: 'Org and team quotes: DM TEAM', format: 'Single image', stage: 'action', brief: 'Deadlines and minimums.' },
    ],
  },
  {
    id: 'year-end',
    name: 'Year-end recap and next year’s slots',
    group: 'Seasons',
    service: 'branding',
    goal: 'leads',
    seasonId: 'yearend',
    description: 'Celebrate the year, thank clients, and book January rebrands.',
    offer: 'Booking next year’s brand projects',
    keyMessage: 'New year, stronger brand.',
    ctaKeyword: 'NEWYEAR',
    leadMagnet: '',
    kpis: [{ metric: 'reach', target: 20000 }, { metric: 'leads', target: 8 }],
    audience: SMALL_BIZ,
    funnelTemplateId: 'studio-leads',
    posts: [
      { week: 0, dow: 5, title: 'JoshWorks year in review', format: 'Reel', stage: 'awareness', brief: 'Montage of the year’s projects; thank clients.' },
      { week: 1, dow: 1, title: 'Rebrand before the new year: signs it’s time', format: 'Carousel', stage: 'awareness', brief: 'Checklist; soft CTA.' },
      { week: 1, dow: 2, title: 'Booking next year’s brand projects', format: 'Single image', stage: 'action', brief: 'Limited January slots.' },
    ],
  },
  {
    id: 'client-launch',
    name: 'Client: product or menu launch',
    group: 'For clients',
    service: 'smm',
    goal: 'launch',
    description: 'Tease, reveal and sell a client’s new product, menu or branch.',
    offer: 'Launch-week promo',
    keyMessage: 'Something new is coming.',
    ctaKeyword: 'ORDER',
    leadMagnet: '',
    kpis: [{ metric: 'reach', target: 20000 }, { metric: 'leads', target: 50 }],
    audience: persona('The client’s customers', 'Locals within 5–10 km', 'Same old options', 'Something new worth trying', '“Is it worth the price?”', 'Facebook, TikTok, Instagram', 'Payday, weekends'),
    funnelTemplateId: 'local-business',
    posts: [
      { week: 0, dow: 2, title: 'Teaser: something new is coming', format: 'Reel', stage: 'awareness', brief: 'Close-ups, no reveal.' },
      { week: 0, dow: 5, title: 'Behind the scenes: making it', format: 'Reel', stage: 'interest', brief: 'The owner or staff on camera.' },
      { week: 1, dow: 1, title: 'Reveal: meet the new product', format: 'Carousel', stage: 'decision', brief: 'Price, where to get it, launch promo.' },
      { week: 1, dow: 4, title: 'Launch promo: comment ORDER', format: 'Single image', stage: 'action', brief: 'Deadline; Messenger keyword.' },
      { week: 2, dow: 2, title: 'First reviews are in', format: 'Carousel', stage: 'loyalty', brief: 'Customer quotes and photos (with permission).' },
    ],
  },
  {
    id: 'client-payday',
    name: 'Client: payday promo',
    group: 'For clients',
    service: 'smm',
    goal: 'sales',
    description: 'A short promo around the 15th or 30th, when people have money to spend.',
    offer: 'Payday bundle or discount',
    keyMessage: 'Treat yourself this payday.',
    ctaKeyword: 'PAYDAY',
    leadMagnet: '',
    kpis: [{ metric: 'leads', target: 30 }],
    audience: persona('Payday shopper', 'Employees and students with allowance', 'Tight budget mid-month', 'A treat that feels worth it', '“Is the promo real?”', 'Facebook, TikTok', 'The 15th and 30th'),
    funnelTemplateId: 'local-business',
    posts: [
      { week: 0, dow: 4, title: 'Payday is coming: sneak peek of the bundle', format: 'Story', stage: 'interest', brief: 'Post the evening before payday.' },
      { week: 0, dow: 5, title: 'Payday bundle: comment PAYDAY', format: 'Single image', stage: 'action', brief: 'Clear price and end time.' },
    ],
  },
];

export interface PlannedPost {
  date: string;
  title: string;
  format: string;
  stage: FunnelStage;
  brief: string;
  series: string;
}

/** Dates for a template's posts from a start day. A post that lands in a break week moves to the week after. */
export function planTemplatePosts(t: CampaignTemplate, start: string, cadence: CadenceSettings): PlannedPost[] {
  const monday = mondayOf(start);
  const out: PlannedPost[] = [];
  for (const p of t.posts) {
    let date = addDays(monday, p.week * 7 + (p.dow - 1));
    let guard = 0;
    while ((date < start || isBreak(cadence, date)) && guard++ < 10) date = addDays(date, 7);
    out.push({ date, title: p.title, format: p.format, stage: p.stage, brief: p.brief, series: p.series ?? '' });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export const GOAL_LABEL: Record<CampaignGoal, string> = {
  awareness: 'Get seen',
  engagement: 'Get people talking',
  leads: 'Get inquiries',
  sales: 'Sell',
  launch: 'Launch something',
  community: 'Build community',
};

export const SERVICE_LABEL: Record<ServiceKey, string> = {
  branding: 'Branding',
  packaging: 'Packaging',
  merch: 'Merchandise',
  stickers: 'Stickers',
  illustration: 'Illustration',
  motion: 'Motion graphics',
  web: 'Website design',
  smm: 'Social media management',
  other: 'Other',
};
