/**
 * What the research says works in 2026, condensed into rules the team can act
 * on. Each card cites where it came from. The weekly trend report keeps the
 * fast-moving part (trends, sounds, dates) fresh; this is the slow-moving part.
 */
export interface PlaybookCard {
  id: string;
  title: string;
  points: string[];
  sources: { title: string; url?: string }[];
}

export const PLAYBOOK: PlaybookCard[] = [
  {
    id: 'signals',
    title: 'What the algorithms reward now',
    points: [
      'Instagram’s top signals are watch time, likes and sends (DM shares). Sends weigh most for reaching people who don’t follow you; likes weigh most with followers.',
      'Originality is ranked up. Accounts that mostly repost lost recommendations in 2026; Facebook also pushes down re-uploads and lightly edited clips. Show your own process, faces and voices.',
      'TikTok is a search engine: say the topic out loud and put it on screen and in the caption. Completion rate around 70% is what gets pushed.',
      'Facebook rewards original Reels: views on original Reels roughly doubled in late 2025.',
    ],
    sources: [
      { title: 'Later: How the Instagram algorithm works (2026)', url: 'https://later.com/blog/how-instagram-algorithm-works/' },
      { title: 'Hootsuite: Social media algorithms in 2026', url: 'https://blog.hootsuite.com/social-media-algorithm/' },
      { title: 'Business Standard: Meta revises Facebook rules on copied content', url: 'https://www.business-standard.com/technology/tech-news/meta-revises-facebook-rules-to-curb-copied-content-in-feed-reels-and-more-content-creator-original-creator-reward-126031600488_1.html' },
      { title: 'Darkroom: TikTok algorithm guide 2026', url: 'https://www.darkroomagency.com/observatory/tiktok-algorithm-guide-2026' },
    ],
  },
  {
    id: 'formats',
    title: 'Formats and specs',
    points: [
      'Instagram allows 5 hashtags per post (since Dec 2025; caption and first comment together). Pick 3–5 specific ones.',
      'Carousels: 8–12 slides for most educational posts. Slide 2 is a second hook: Instagram re-shows carousels starting there.',
      'Feed posts at 4:5 (1080×1350). Reels, TikToks and Stories at 9:16 (1080×1920), with text kept out of the bottom fifth.',
      'If it fits in one frame and reads in 3 seconds, post a single image or a Reel instead of a carousel.',
    ],
    sources: [
      { title: 'Instagram limits hashtags to 5 (Dec 2025)', url: 'https://www.lilachbullock.com/instagram-hashtag-limit/' },
      { title: 'Metricool: Instagram carousel best practices 2026', url: 'https://metricool.com/instagram-carousels/' },
    ],
  },
  {
    id: 'ph',
    title: 'The Philippine audience',
    points: [
      'Facebook still reaches almost everyone; TikTok is where Filipinos spend the most time; Instagram is the visual showcase.',
      'Trust decides purchases: reviews, real faces, clear prices and cash-on-delivery or easy payment options.',
      'Best times (PHT): Facebook 6–8 PM, Instagram 8–10 PM, TikTok early evening. Check your own Results page after a few weeks.',
      'Paydays (15th and 30th) and double-day sales (10.10, 11.11, 12.12) move money; post offers the evening before.',
    ],
    sources: [
      { title: 'Meltwater: Social media statistics, Philippines 2026', url: 'https://www.meltwater.com/en/blog/social-media-statistics-philippines' },
      { title: 'TeamAsia: Social media trends in the Philippines 2026', url: 'https://www.teamasia.com/best-selling-products-ph-2026/' },
      { title: 'TimeToPost: Best time to post on Facebook in the Philippines', url: 'https://timetopost.co/best-time-to-post/facebook/philippines/' },
    ],
  },
  {
    id: 'growth',
    title: 'Growth habits (from creator coaches)',
    points: [
      'You want endless ideas, consistency and growth? Templatize what works, bank b-roll, and post even when it feels messy.',
      'You want followers and views? Make Reels and study outliers: posts that did 2× or more your usual views.',
      'You want to go viral and be trusted? Stack hooks (visual + on-screen text + spoken) and show your face.',
      'Save every scroll-stopping reel and write down why it caught you. Rewrite one viral hook a day in your own words for 30 days.',
      'Voice-note your next idea to a friend: how you say it naturally is your script. Turn comments on your best posts into your next videos.',
      'Watch your own videos muted. If you want to scroll away, the pacing needs work.',
    ],
    sources: [{ title: 'Kienobi (creator coach), reels the team saved' }],
  },
  {
    id: 'premium',
    title: 'Making designs look premium',
    points: [
      'Fundamentals beat effects: hierarchy, contrast, grid, type, colour and balance.',
      'A real concept, an actual story, presented well. “Wow” starts with the message; design amplifies it.',
      'White space is the lungs of the layout. Simplify, then remove two more things before you finish.',
      'Good typography and kerning, elegant pairings. A touch of grain or texture can make it feel printed.',
      'Context decides: what wows a ballet audience won’t wow truck buyers.',
    ],
    sources: [{ title: 'r/graphic_design: go-to techniques for making designs look premium', url: 'https://www.reddit.com/r/graphic_design/' }],
  },
  {
    id: 'smm',
    title: 'Landing SMM clients fast',
    points: [
      'Fundamentals: roles, package vs hourly pricing, platforms, tools, content types, manager vs marketer.',
      'Process: discovery call → contract → onboarding → strategy → content → approval → scheduling → execution → analytics report.',
      'Strategy: market research, trend analysis, content analysis, an audience persona.',
      'Never work without a contract: scope, client duties, payment terms and late fees, revisions, confidentiality, IP, a results disclaimer and termination.',
    ],
    sources: [{ title: 'Learn SMM with Gis Kaye, reels the team saved' }],
  },
];
