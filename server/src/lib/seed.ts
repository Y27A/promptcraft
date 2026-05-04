import "dotenv/config";
import { db } from "../db/client";
import { templates } from "../db/schema";

const SEED_TEMPLATES = [
  {
    title: "Blog Post Writer",
    description: "Craft engaging, SEO-optimized blog posts on any topic with a clear structure.",
    category: "writing",
    content: "Write a detailed blog post about [TOPIC].",
    difficulty: "beginner" as const,
    tags: ["writing", "blog", "SEO"],
  },
  {
    title: "Code Reviewer",
    description: "Review code for bugs, security issues, and best practices.",
    category: "code",
    content: "Review the following code for bugs, security vulnerabilities, and improvements: [CODE]",
    difficulty: "intermediate" as const,
    tags: ["code", "review", "security"],
  },
  {
    title: "Marketing Email",
    description: "Write cold outreach or product marketing emails that convert.",
    category: "marketing",
    content: "Write a compelling marketing email for [PRODUCT] targeting [AUDIENCE].",
    difficulty: "beginner" as const,
    tags: ["email", "marketing", "copywriting"],
  },
  {
    title: "Research Summary",
    description: "Summarize academic papers or research articles into plain language.",
    category: "research",
    content: "Summarize the key findings of this research paper in plain language: [PAPER]",
    difficulty: "intermediate" as const,
    tags: ["research", "summary", "academic"],
  },
  {
    title: "Meeting Agenda Creator",
    description: "Structure productive meeting agendas with clear objectives and time blocks.",
    category: "productivity",
    content: "Create a structured meeting agenda for a [MEETING TYPE] meeting about [TOPIC].",
    difficulty: "beginner" as const,
    tags: ["meeting", "productivity", "planning"],
  },
  {
    title: "API Documentation Writer",
    description: "Write clear, developer-friendly API documentation.",
    category: "code",
    content: "Write comprehensive API documentation for the following endpoint: [ENDPOINT SPEC]",
    difficulty: "intermediate" as const,
    tags: ["docs", "API", "developer"],
  },
  {
    title: "Social Media Caption",
    description: "Create engaging social media captions with relevant hashtags.",
    category: "marketing",
    content: "Write 5 social media captions for [PLATFORM] about [TOPIC] targeting [AUDIENCE].",
    difficulty: "beginner" as const,
    tags: ["social", "caption", "hashtags"],
  },
  {
    title: "SQL Query Builder",
    description: "Generate optimized SQL queries from plain English descriptions.",
    category: "code",
    content: "Write an optimized SQL query to [DESCRIPTION]. Table schema: [SCHEMA]",
    difficulty: "intermediate" as const,
    tags: ["SQL", "database", "query"],
  },
  {
    title: "Literature Review",
    description: "Write a systematic literature review for a research topic.",
    category: "research",
    content: "Write a literature review covering the key themes, debates, and gaps in research on: [TOPIC]",
    difficulty: "advanced" as const,
    tags: ["literature", "review", "academic"],
  },
  {
    title: "Product Launch Announcement",
    description: "Announce a product launch with excitement and clarity.",
    category: "marketing",
    content: "Write a product launch announcement for [PRODUCT NAME], highlighting [KEY FEATURES] for [TARGET AUDIENCE].",
    difficulty: "beginner" as const,
    tags: ["launch", "announcement", "PR"],
  },
  {
    title: "Technical Tutorial",
    description: "Create step-by-step technical tutorials with code examples.",
    category: "writing",
    content: "Write a step-by-step tutorial explaining how to [TECHNICAL TASK] using [TECHNOLOGY].",
    difficulty: "intermediate" as const,
    tags: ["tutorial", "technical", "education"],
  },
  {
    title: "Data Analysis Report",
    description: "Analyze datasets and present findings with actionable insights.",
    category: "research",
    content: "Analyze the following dataset and provide a report with key insights and recommendations: [DATA]",
    difficulty: "advanced" as const,
    tags: ["data", "analysis", "insights"],
  },
];

async function seed() {
  console.log("Seeding templates…");
  await db.delete(templates);
  await db.insert(templates).values(SEED_TEMPLATES);
  console.log(`Seeded ${SEED_TEMPLATES.length} templates.`);
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
