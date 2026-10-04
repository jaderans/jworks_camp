# The weekly trend report

[`public/trends/latest.json`](../public/trends/latest.json) is the report the whole team sees under **Trends this week** on the dashboard and on **Trends → This week**. It's published with the app, so reading it needs no API key, and devices keep the last one for offline use. Each item has **Make a post** and **Save** (to the trend board) buttons.

There are three ways to update it.

## 1. A scheduled Claude routine (recommended)

Every Monday at 8:00 AM Manila time, a Claude routine with access to this repository researches the week, rewrites the file, checks it and pushes it. The push redeploys the app, so the new report shows up on everyone's phone a few minutes later.

To set it up, run `/schedule` in Claude Code and ask for a weekly routine on **Mondays at 8:00 AM Asia/Manila** with the prompt below. It needs push access to `jaderans/jworks_camp`.

The routine only ever changes `public/trends/latest.json`. It never sees the team's posts, clients or numbers, which stay on your devices and in your own Firebase. The deploy runs the tests first, so a broken report is never published.

### The routine prompt

```text
You maintain the weekly trend report for JoshWorks Campaigns (repository jaderans/jworks_camp), the marketing app of JoshWorks: a DTI-registered creative studio in Iloilo City, Philippines. JoshWorks does branding, packaging, merchandise, stickers, illustration, motion graphics and website design, and runs social media for local businesses. Its weekly themes: Monday educational, Tuesday portfolio, Wednesday flex, Thursday a designer's story, Friday behind the scenes or fun. It posts on Facebook, Instagram and TikTok.

Every run:

1. Work out this week's Monday in Asia/Manila as YYYY-MM-DD.
2. Read src/domain/trendFeed.ts (the format and its limits) and the current public/trends/latest.json. Don't repeat last week's items unless they are still growing.
3. Research with web search, preferring sources from the last 30 days:
   - TikTok, Instagram Reels and Facebook trends (sounds, formats, memes) that a design studio can use, and whether business accounts can use the sound;
   - platform changes that matter to small businesses (algorithm, features, limits);
   - graphic design, branding and packaging trends;
   - Philippine dates in the next 6 weeks: official holidays under the current proclamation, Iloilo and Western Visayas events, double-day sales, paydays.
4. Rewrite public/trends/latest.json:
   - "weekOf": this Monday; "generatedAt": the current time in ISO format;
   - "summary": 2–3 sentences;
   - "items": 5 to 8 objects with "id", "title", "platform" (facebook, instagram, tiktok, threads, x, youtube or any), "kind" (sound, format, meme, design, platform or local), "what", "why", "howJoshWorks" (one concrete JoshWorks post idea), "postIdea" ({"title", "format": Reel, Carousel, Single image or Story, "themeKey": mon-edu, tue-portfolio, thu-designer or fri-behind}, or null), "expires" (YYYY-MM-DD or null) and "sources" ([{"title", "url"}], at least one);
   - "dates": [{"date", "name", "idea"}] for the next 6 weeks;
   - "sources": every page you used.
   Only cite pages you actually opened in this run; never invent a URL. Write plain, friendly English; Filipino words are fine where they're natural.
5. Run `npm ci`, then `npx vitest run tests/domain.test.ts`. The test "reads the published weekly report without dropping anything" must pass; fix the JSON until it does.
6. Commit only public/trends/latest.json with the message "Trend report for the week of YYYY-MM-DD" and push to main.
```

## 2. From the app

Anyone with a Claude API key on their device (Settings → Assistant (Claude)) can open **Trends → This week → Research trends now**. The report is saved in the app and syncs to the team if cloud sync is on, but it doesn't change the published file. A run takes a minute or two and costs about 10–30 US cents; the app shows the actual cost afterwards.

## 3. By hand

Edit `public/trends/latest.json` in GitHub's web editor, keep the same shape and commit to `main`. If the deploy's checks fail, something in the file doesn't match the format (a missing source, a bad date or a typo in the JSON); compare it with the previous version in the file's history.
