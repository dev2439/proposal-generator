import { writeFileSync } from "fs";
import { buildResumeHtml } from "../lib/resume/build-resume-html";
import { htmlToPdf } from "../lib/resume/html-to-pdf";

const profile = {
  title: "GA4, Tag Manager & Ecommerce Analytics Specialist for Shopify Brands",
  hourlyRate: "45",
  overview: `Ecommerce startup needed end-to-end GA4, Tag Manager & Shopify purchase tracking — achieved full-funnel analytics in days, not weeks.
Digital agency required GA4 + Meta pixel reporting overhaul for CPG client — delivered automated Looker Studio dashboards & actionable attribution insights.
High-volume retailer lacked conversion-focused tracking — implemented robust goal setup, resulting in recoverable ROAS clarity.

## Ecommerce Analytics Architect With Real-World Experience
I engineer revenue-focused, audit-proof analytics infrastructures for ecommerce, D2C brands, and agencies. Deep experience with GA4, Google Tag Manager, Shopify, Meta/Facebook Pixel, Looker Studio, and advanced cross-platform tracking. I don't just pipe in events-I translate data chaos into commercial results.

- Stack: GA4, Google Tag Manager, Google Ads, Meta/Facebook Pixel, Shopify, Looker Studio, Analytics Account/Goal Setup, Tag Install, Purchase Tracking, Conversion Evaluation

## Strategic Analytics for Revenue Growth
From pixel-perfect purchase event tracking on Shopify to multi-channel ROAS reporting, I leverage Google Tag Manager to stitch your analytics ecosystem together. My workflow ensures you capture, organize, and activate every key user action. Your marketing spend, website UX, and campaign KPIs become quantifiable-and optimizable.
- D2C brands: End-to-end ecommerce conversions-cart, checkout, LTV, and subscription pipelines.
- Agencies: Streamlined Tag Manager container design, multi-client rollouts, QA frameworks.
- SMB Retailers: Automated Looker Studio dashboards, tailored GA4 reporting, actionable goal setting.
- Shopify store owners: Seamless integration, pixel fixes, and accurate sales attribution.

## Typical Challenges I Solve
> Purchase events fail to trigger in Shopify and GA4?
Solution: Custom event mapping, Tag Manager debugging, Shopify dataLayer repairs.
> Lacking clear Facebook/Meta ROAS or CAC reporting?
Solution: Server-side Pixel, deduplication, cross-channel attribution windows.
> Manual, unreliable Google Analytics reports?
Solution: Automated Looker Studio dashboards with embedded filters, channel grouping, and dynamic widgets.

## GA4 & Google Tag Manager Mastery
- Multi-container setup & audit
- Event, goal, and purchase tracking via dataLayer
- Custom dimensions & user property enrichment
- Enhanced ecommerce tagging for Shopify
- GA4 DebugView & real-time troubleshooting
- Cross-domain and subdomain analytics

## Meta & Facebook Pixel Optimization
- Shopify/GA4-Facebook data alignment
- Pixel deduplication and advanced events
- CAPI (Conversions API) server-side integration
- Purchase, lead, and content view events
- Consent mode & privacy compliance

## Tech Stack
Analytics Suite: GA4, Universal Analytics, Google Tag Manager, Meta/Facebook Pixel, Google Ads
Shopify Ecosystem: Shopify Admin, Shopify Scripts, dataLayer customizations
Reporting: Looker Studio, Google Analytics Report automation, site/event evaluations
Ready to turn siloed data into e-commerce profit? Let's build a tracking foundation that empowers revenue decisions.`,
  skills: [
    "Google Analytics",
    "GA4",
    "Google Tag Manager",
    "Shopify",
    "Ecommerce Analytics",
    "Looker Studio",
    "Analytics & Tracking Setup",
    "Conversion Tracking",
    "Google Ads",
    "Facebook Pixel",
    "Meta Pixel",
    "DataLayer Implementation",
    "Purchase Funnel Tracking",
    "Conversion Optimization",
    "Tag Installation & Debugging",
    "Web Analytics Consulting",
    "Analytics Reporting",
    "Goals & Events Setup",
    "Marketing Attribution",
    "Digital Marketing Analytics",
  ],
  employment: [
    {
      company: "Seer Interactive",
      role: "Senior Analytics Implementation Specialist",
      location: "Philadelphia, United States",
      period: "February 2018 — June 2020",
      description:
        "Specialized in implementing GA4, Google Tag Manager, and Meta Pixel tracking solutions for ecommerce and D2C brands.\n- Designed end-to-end tracking infrastructures for Shopify migrations.\n- Built Tag Manager containers for multi-client accounts.\n- Managed Looker Studio dashboard implementations.\n- Collaborated with PPC, SEO, and social media teams.",
    },
    {
      company: "Rocket Clicks",
      role: "Lead Web Analytics Strategist",
      location: "Menomonee Falls, United States",
      period: "July 2020 — August 2023",
      description:
        "Owned the full lifecycle of analytics deployment for paid media, SEO, and ecommerce clients.\n- Architected Google Analytics/Tag Manager solutions for Shopify campaigns.\n- Integrated Google Ads and Meta/Facebook Pixel reporting.\n- Established analytics account structures and tagging standards.\n- Developed automated Looker Studio dashboards.",
    },
    {
      company: "Daasity",
      role: "Ecommerce Analytics Solutions Engineer",
      location: "San Diego, United States",
      period: "September 2023 — July 2026",
      description:
        "Technical lead for GA4 and Shopify-focused analytics integrations.\n- Customized GA4/Tag Manager/Meta Pixel setups for Shopify merchants.\n- Implemented conversion-focused dataLayer and attribution.\n- Built Looker Studio dashboards for LTV, ROAS, and funnel drop-offs.\n- Advised on analytics architecture and privacy compliance.",
    },
  ],
  education: [
    {
      university: "Universidad UCAD",
      degree: "Ingeniería en Sistemas Computacionales",
      period: "2010 — 2014",
      description:
        "Completed relevant coursework in web analytics, data systems, and software engineering. Built foundational skills in technical tracking, database structures, and information architecture.",
    },
    {
      university: "Universidad Tecnológica de México",
      degree: "Maestría en Ingeniería de Software",
      period: "2014 — 2016",
      description:
        "Graduate study in software architecture, data systems, and applied computing for product engineering.",
    },
  ],
};

async function main() {
  const html = buildResumeHtml(profile);
  writeFileSync("/tmp/upwork-resume.html", html);
  const pdf = await htmlToPdf(html);
  writeFileSync("/tmp/upwork-resume.pdf", pdf);
  console.log("Wrote /tmp/upwork-resume.html and /tmp/upwork-resume.pdf", pdf.length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
