# Pocket AI — SEO launch checklist

## Implemented
- Production canonical URLs use https://pocket-ai-creators.vercel.app/.
- Descriptive homepage title, description, Open Graph and Twitter metadata.
- WebSite, Organization and WebPage JSON-LD; Article JSON-LD on three guides.
- Six featured tool descriptions are in the initial HTML, not only JavaScript.
- Three standalone, internally linked creator guides with unique metadata.
- robots.txt and sitemap.xml (homepage, everyday tools and public guides).
- Permanent Vercel redirect from /index.html to / to consolidate duplicates.
- Studio and banner documents remain noindex; APIs are excluded from crawling.
- Self-hosted fonts and responsive styling retained.

## After deploying
1. Merge/push only when approved. Confirm Vercel deploys the intended Git branch.
   A feature branch preview is not necessarily the production deployment.
2. Confirm the production homepage, /robots.txt, /sitemap.xml and each guide
   return successfully. Preview deployment protections must not apply to production.
3. Verify ownership in Google Search Console using the URL-prefix property for
   https://pocket-ai-creators.vercel.app/. Use the real verification meta token or
   HTML file provided by Google; none has been fabricated or added here.
4. Submit https://pocket-ai-creators.vercel.app/sitemap.xml and inspect/request
   indexing for the homepage and guides. Requests do not guarantee indexing.
5. Verify the same site in Bing Webmaster Tools and submit the sitemap there.
6. Check rendered pages, structured data, mobile usability and Core Web Vitals
   on production. Local tests validate markup, not search-engine eligibility.
7. Monitor indexed URLs, branded queries, impressions and clicks over time.

## Sustainable growth
- Publish helpful, original guides and examples of actual work. Avoid fake reviews,
  unsupported results, keyword stuffing and purchased spam links.
- Use the Pocket AI name consistently on genuine business profiles and link them
  to the site. Build relevant mentions through useful content and real projects.
- The phrase “Pocket AI” is not exclusive to this site. Ranking first is not
  guaranteed by metadata, structured data, Vercel hosting or ad approval.
- Popunders and floating ads can distract users; assess their effect on mobile
  usability, page speed and conversions. Keep consent controls available and
  disable intrusive formats if they interfere with content.
- If switching to a custom domain/subdomain, change all canonical, Open Graph,
  structured-data and sitemap URLs, update robots.txt's sitemap URL, redirect
  the former production origin and verify the new property in webmaster tools.

## Not performed
No push, production deployment, search-engine verification/submission or live
ranking audit was performed as part of these local SEO changes. No first-place
ranking or indexing timeline is promised.

## Per-tool SEO coverage

There are now **36 unique tool guide pages**, plus a tool-guide hub, covering all
23 practical directory entries and 14 homepage AI entries. YouTube Tags shares
one guide between the local and AI workflows instead of creating competing near-
duplicate pages. The sitemap has **43 canonical public URLs** in total.

- Editorial content: `tools/seo-content.json` and `tools/ai-seo-content.json`.
- Generator: `scripts/build-tool-seo.mjs` (`npm run build:seo`).
- Output: `/tool-guides/index.html` and `/tool-guides/<descriptive-slug>.html`.
- Each guide has a unique title, meta description, H1, use case, instructions,
  worked example, limitations and visible FAQ. Metadata includes canonical URLs,
  Open Graph, Twitter cards, WebPage, SoftwareApplication and BreadcrumbList.
- No fabricated reviews, ratings, keyword lists, income promises or ranking claims
  were added. FAQ rich results are not promised. Structured data does not guarantee
  a rich search result.
- “Free”/“no added watermark” claims are limited to the actual local workflows.
  AI pages disclose provider requirements; tax is an estimate; PDF compression is
  best-effort; no page claims to provide a nonexistent link-shortening service.
- Tool-guide links appear next to tool cards in initial HTML, not only after JS.
  AI guide launch links open the matching AI form without generating automatically.
- `npm run build` regenerates guides, JS bundles and crawlable card HTML. Edit the
  source content rather than generated pages. Tests enforce one guide per declared
  tool, valid guide links, unique metadata, correct canonical URLs and JSON-LD.
- A real Chromium check loaded all 36 guide URLs and clicked every primary CTA:
  each opened the intended tool/form. Representative mobile layouts passed.

These are local SEO changes. They have not been deployed or submitted to search
engines. After production deployment, submit the updated sitemap in verified
Google Search Console and Bing Webmaster Tools, then monitor actual indexing and
query performance. Keyword choices describe existing functionality; they are not
based on a live keyword-volume study.
