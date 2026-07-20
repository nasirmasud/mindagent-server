import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Item from "../models/Item.js";
import ChatSession from "../models/ChatSession.js";
import GeneratedContent from "../models/GeneratedContent.js";
import ImageAnalysis from "../models/ImageAnalysis.js";
import { signToken } from "../utils/jwt.js";
import { registerSchema, loginSchema, googleSchema, updateProfileSchema, changePasswordSchema } from "../validators/auth.js";
import { protect, AuthRequest } from "../middleware/protect.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.use(authRateLimiter);

router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      res.status(400).json({ success: false, message: "Email already in use" });
      return;
    }
    const hashed = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashed,
      authProvider: "email",
      ...(data.avatar ? { avatar: data.avatar } : {}),
    });
    const token = signToken(user._id.toString());
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, authProvider: user.authProvider, createdAt: user.createdAt } });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ success: false, errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email });
    if (!user || !user.password) {
      res.status(400).json({ success: false, message: "Invalid credentials" });
      return;
    }
    const match = await bcrypt.compare(data.password, user.password);
    if (!match) {
      res.status(400).json({ success: false, message: "Invalid credentials" });
      return;
    }
    const token = signToken(user._id.toString());
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ success: false, errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

const DEMO_ITEMS = [
  {
    title: "Q3 Sales Performance Analysis",
    shortDescription: "Strong revenue growth with regional disparities across 4 quarters",
    fullDescription: "Analysis of Q3 2025 sales data reveals a 23% year-over-year revenue increase, driven primarily by the North American and APAC regions.",
    sourceFileName: "q3-sales-2025.csv",
    sourceFileType: "csv" as const,
    rowCount: 12450,
    columns: ["Region", "Product", "Revenue", "Units", "Date", "Category", "Discount"],
    parsedPreview: [
      { Region: "North America", Product: "Laptop Pro", Revenue: 45000, Units: 120, Date: "2025-07-15", Category: "Electronics", Discount: "5%" },
      { Region: "Europe", Product: "Wireless Mouse", Revenue: 12000, Units: 400, Date: "2025-07-16", Category: "Accessories", Discount: "10%" },
      { Region: "APAC", Product: "Smartphone X", Revenue: 78000, Units: 250, Date: "2025-07-17", Category: "Electronics", Discount: "0%" },
    ],
    insights: {
      summary: "Q3 2025 shows strong overall growth at 23% YoY, led by Electronics (+38%) and North American market (+31%).",
      trends: ["Electronics category growing 38% YoY", "North America + APAC account for 71% of total sales"],
      kpis: [{ label: "Total Revenue", value: "$1.2M" }, { label: "YoY Growth", value: "23%" }, { label: "Avg Order Value", value: "$312" }],
      risks: ["LATAM revenue declining 2%", "Electronics concentration risk (52% of revenue)"],
    },
    chartData: [{ label: "North America", value: 452000 }, { label: "APAC", value: 398000 }, { label: "Europe", value: 215000 }, { label: "LATAM", value: 89000 }],
  },
  {
    title: "Customer Churn Risk Assessment",
    shortDescription: "12% monthly churn rate identified — 3 key risk segments",
    fullDescription: "Analysis of 50K customer records over 6 months reveals a 12% monthly churn rate, with 3 high-risk segments.",
    sourceFileName: "customer-data-2025.json",
    sourceFileType: "json" as const,
    rowCount: 50230,
    columns: ["userId", "age", "plan", "loginsPerWeek", "supportTickets", "tenureMonths", "churned"],
    parsedPreview: [
      { userId: "USR001", age: 24, plan: "Basic", loginsPerWeek: 1, supportTickets: 0, tenureMonths: 2, churned: true },
      { userId: "USR002", age: 45, plan: "Pro", loginsPerWeek: 7, supportTickets: 3, tenureMonths: 24, churned: false },
      { userId: "USR003", age: 31, plan: "Basic", loginsPerWeek: 2, supportTickets: 1, tenureMonths: 6, churned: false },
    ],
    insights: {
      summary: "12% monthly churn rate identified. Three high-risk segments: young users (18-25), zero-support-ticket accounts, and low-engagement basic plan users.",
      trends: ["Users aged 18-25 churn at 22%", "Zero support tickets correlates with 18% churn"],
      kpis: [{ label: "Monthly Churn", value: "12%" }, { label: "At-Risk Users", value: "8,450" }, { label: "Enterprise Retention", value: "98%" }],
      risks: ["New user onboarding failure", "Free tier users have near-zero engagement"],
    },
    chartData: [{ label: "18-25", value: 22 }, { label: "26-35", value: 10 }, { label: "36-45", value: 7 }, { label: "46-55", value: 5 }],
  },
  {
    title: "Employee Satisfaction Survey Analysis",
    shortDescription: "Overall score 7.8/10 — Work-Life Balance rated highest",
    fullDescription: "Analysis of 2,340 employee survey responses reveals an overall satisfaction score of 7.8/10.",
    sourceFileName: "employee-survey-2025.xlsx",
    sourceFileType: "xlsx" as const,
    rowCount: 2340,
    columns: ["department", "workLifeBalance", "careerGrowth", "compensation", "management", "overall", "tenure"],
    parsedPreview: [
      { department: "Engineering", workLifeBalance: 8.5, careerGrowth: 7.0, compensation: 8.0, management: 8.5, overall: 8.4, tenure: 3.5 },
      { department: "Sales", workLifeBalance: 7.0, careerGrowth: 6.5, compensation: 9.0, management: 6.0, overall: 7.0, tenure: 2.1 },
      { department: "HR", workLifeBalance: 9.0, careerGrowth: 7.5, compensation: 7.5, management: 8.0, overall: 8.1, tenure: 5.2 },
    ],
    insights: {
      summary: "Overall satisfaction: 7.8/10. Strengths: Work-Life Balance (8.6). Weaknesses: Career Growth (6.2).",
      trends: ["Work-Life Balance consistently scores highest", "Career Growth scores dropped 0.4 points"],
      kpis: [{ label: "Overall Score", value: "7.8 / 10" }, { label: "Top Department", value: "Engineering (8.4)" }, { label: "Response Rate", value: "85%" }],
      risks: ["Career Growth score of 6.2 — top flight risk driver", "Operations department at 6.8"],
    },
    chartData: [{ label: "Engineering", value: 8.4 }, { label: "HR", value: 8.1 }, { label: "Finance", value: 7.6 }, { label: "Sales", value: 7.0 }],
  },
  {
    title: "Website Performance Metrics Analysis",
    shortDescription: "Page load improved 40% after CDN migration — bounce rate down 12%",
    fullDescription: "Analysis of 2.8M user sessions reveals significant performance improvements following the CDN migration.",
    sourceFileName: "web-analytics-aug.csv",
    sourceFileType: "csv" as const,
    rowCount: 2800000,
    columns: ["date", "pageLoadTime", "bounceRate", "conversionRate", "sessions", "deviceType", "source"],
    parsedPreview: [
      { date: "2025-08-01", pageLoadTime: 4.1, bounceRate: 47, conversionRate: 2.2, sessions: 45200, deviceType: "Mobile", source: "Organic" },
      { date: "2025-08-15", pageLoadTime: 2.4, bounceRate: 36, conversionRate: 3.3, sessions: 48500, deviceType: "Mobile", source: "Organic" },
      { date: "2025-09-01", pageLoadTime: 2.5, bounceRate: 36, conversionRate: 3.4, sessions: 47500, deviceType: "Desktop", source: "Organic" },
    ],
    insights: {
      summary: "CDN migration improved page load time by 40% (4.2s to 2.5s). Bounce rate dropped 12 points. Conversion rate rose from 2.1% to 3.4%.",
      trends: ["Page load time dropped 40% after CDN migration", "Mobile bounce rate improved 16 points"],
      kpis: [{ label: "Avg Load Time", value: "2.5s" }, { label: "Bounce Rate", value: "36%" }, { label: "Conversion Rate", value: "3.4%" }],
      risks: ["Mobile conversion still lags desktop by 1.3 points", "Paid traffic has highest bounce rate (41%)"],
    },
    chartData: [{ label: "Before CDN", value: 4.2 }, { label: "Week 1", value: 2.8 }, { label: "Week 2", value: 2.5 }, { label: "Week 3", value: 2.4 }],
  },
];

router.post("/demo-login", async (_req: Request, res: Response) => {
  try {
    let user = await User.findOne({ email: "demo@mindagent.ai" });
    if (!user) {
      user = await User.create({
        name: "Demo User",
        email: "demo@mindagent.ai",
        authProvider: "email",
      });
    }

    const itemCount = await Item.countDocuments({ ownerId: user._id });
    if (itemCount === 0) {
      const items = DEMO_ITEMS.map((r) => ({ ...r, ownerId: user!._id, status: "completed" as const }));
      await Item.insertMany(items);
    }

    const chatCount = await ChatSession.countDocuments({ userId: user._id });
    if (chatCount === 0) {
      const now = new Date();
      await ChatSession.insertMany([
        {
          userId: user._id,
          agentType: "assistant",
          messages: [
            { role: "system", content: "You are MindAgent Assistant.", timestamp: new Date(now.getTime() - 86400000 * 3) },
            { role: "user", content: "Help me analyze Q3 sales data trends", timestamp: new Date(now.getTime() - 86400000 * 3 + 1000) },
            { role: "assistant", content: "Based on your Q3 sales data, here are the key trends: North America leads with 38% growth, Electronics is the top category, and LATAM shows a slight decline. I'd recommend focusing on the APAC market expansion.", timestamp: new Date(now.getTime() - 86400000 * 3 + 2000) },
          ],
        },
        {
          userId: user._id,
          agentType: "assistant",
          messages: [
            { role: "system", content: "You are MindAgent Assistant.", timestamp: new Date(now.getTime() - 86400000 * 2) },
            { role: "user", content: "What strategies can reduce customer churn?", timestamp: new Date(now.getTime() - 86400000 * 2 + 1000) },
            { role: "assistant", content: "Based on your churn analysis, here are 3 strategies: 1) Implement onboarding workflows for the 18-25 age group (22% churn). 2) Create proactive support outreach for zero-ticket accounts. 3) Add engagement triggers for low-login basic plan users.", timestamp: new Date(now.getTime() - 86400000 * 2 + 2000) },
          ],
        },
        {
          userId: user._id,
          agentType: "assistant",
          messages: [
            { role: "system", content: "You are MindAgent Assistant.", timestamp: new Date(now.getTime() - 86400000) },
            { role: "user", content: "Summarize the employee satisfaction results", timestamp: new Date(now.getTime() - 86400000 + 1000) },
            { role: "assistant", content: "Your employee satisfaction survey shows an overall score of 7.8/10. Work-Life Balance is the strongest area (8.6/10), while Career Growth needs attention (6.2/10). Engineering is the most satisfied department at 8.4.", timestamp: new Date(now.getTime() - 86400000 + 2000) },
          ],
        },
      ]);
    }

    const imageCount = await ImageAnalysis.countDocuments({ userId: user._id });
    if (imageCount === 0) {
      const now = new Date();
      await ImageAnalysis.insertMany([
        {
          userId: user._id,
          imageData: "",
          imageName: "product-revenue-chart.png",
          prompt: "Analyze the revenue trends in this chart",
          analysis: "The bar chart shows quarterly revenue growth from Q1 to Q3 2025. Q3 shows the highest revenue at $1.2M, representing a 23% year-over-year increase. Electronics and North American markets are the primary growth drivers.",
          tags: [{ label: "chart", conf: 0.95 }, { label: "revenue", conf: 0.9 }, { label: "quarterly", conf: 0.85 }],
          dimensions: { width: 1200, height: 800 },
          palette: ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"],
          createdAt: new Date(now.getTime() - 86400000 * 4),
        },
        {
          userId: user._id,
          imageData: "",
          imageName: "churn-dashboard.png",
          prompt: "What insights can you derive from this dashboard?",
          analysis: "This dashboard displays customer churn metrics across demographics. The 18-25 age group shows the highest churn rate at 22%. Enterprise plan retention is excellent at 98%. The first 30 days is the critical retention window.",
          tags: [{ label: "dashboard", conf: 0.92 }, { label: "churn", conf: 0.88 }, { label: "metrics", conf: 0.85 }],
          dimensions: { width: 1920, height: 1080 },
          palette: ["#6366f1", "#ec4899", "#14b8a6", "#f97316"],
          createdAt: new Date(now.getTime() - 86400000 * 2),
        },
      ]);
    }

    const genCount = await GeneratedContent.countDocuments({ userId: user._id });
    if (genCount === 0) {
      const now = new Date();
      await GeneratedContent.insertMany([
        {
          userId: user._id,
          prompt: "Write a professional blog post about Q3 sales performance highlights",
          output: "## Q3 2025 Sales Performance: A Quarter of Strong Growth\n\nQ3 2025 marked a significant milestone for our sales organization, delivering a 23% year-over-year revenue increase. North America and APAC regions led the charge, while the electronics category emerged as the clear winner with 38% growth.\n\n### Key Highlights\n- Total revenue reached $1.2M\n- Electronics category dominated with 38% growth\n- North America and APAC accounted for 71% of sales\n- Inventory turnover improved by 15%",
          contentType: "blog",
          provider: "openrouter",
          createdAt: new Date(now.getTime() - 86400000 * 5),
        },
        {
          userId: user._id,
          prompt: "Write a persuasive social media post about customer retention strategies",
          output: "Customer churn doesn't have to be inevitable. Here are 3 data-backed strategies that reduced churn by 40% for our clients:\n\n Onboarding flows for new users (reduces first-30-day churn by 60%)\n Proactive support for silent accounts\n Engagement triggers for low-activity users\n\n#CustomerRetention #SaaS #GrowthHacking #DataDriven",
          contentType: "social",
          provider: "openrouter",
          createdAt: new Date(now.getTime() - 86400000 * 3),
        },
        {
          userId: user._id,
          prompt: "Write a friendly product description for the MindAgent analytics dashboard",
          output: "Meet MindAgent Analytics — your AI-powered command center for business intelligence. Upload any CSV, Excel, or JSON file and get instant AI-generated insights, trends, and visualizations. No data science degree required. Simply drag, drop, and discover what your data is really telling you.",
          contentType: "product",
          provider: "openrouter",
          createdAt: new Date(now.getTime() - 86400000 * 2),
        },
        {
          userId: user._id,
          prompt: "Write professional documentation for the MindAgent chat feature",
          output: "# MindAgent AI Chat Assistant\n\n## Overview\nThe AI Chat Assistant is your always-available productivity partner. It understands your project context and helps with analysis, writing, brainstorming, and decision-making.\n\n## Features\n- **Streaming Responses**: See answers in real-time as they're generated\n- **Session History**: All conversations are saved for future reference\n- **Follow-up Suggestions**: Get AI-recommended next questions\n- **Multi-turn Context**: The assistant remembers your conversation history",
          contentType: "docs",
          provider: "openrouter",
          createdAt: new Date(now.getTime() - 86400000),
        },
      ]);
    }

    const token = signToken(user._id.toString());
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, authProvider: user.authProvider, createdAt: user.createdAt } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/google", async (req: Request, res: Response) => {
  try {
    const data = googleSchema.parse(req.body);
    let user = await User.findOne({ email: data.email });
    if (!user) {
      user = await User.create({
        name: data.name,
        email: data.email,
        googleId: data.googleId,
        avatar: data.avatar,
        authProvider: "google",
      });
    }
    const token = signToken(user._id.toString());
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, authProvider: user.authProvider, createdAt: user.createdAt } });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ success: false, errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/me", protect, (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: req.user });
});

router.put("/me", protect, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { $set: data },
      { new: true }
    ).select("-password");
    res.json({ success: true, user });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ success: false, errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/password", protect, async (req: AuthRequest, res: Response) => {
  try {
    const data = changePasswordSchema.parse(req.body);
    const user = await User.findById(req.user!._id);
    if (!user || user.authProvider !== "email" || !user.password) {
      res.status(400).json({ success: false, message: "Password change not available for this account" });
      return;
    }
    const match = await bcrypt.compare(data.currentPassword, user.password);
    if (!match) {
      res.status(400).json({ success: false, message: "Current password is incorrect" });
      return;
    }
    user.password = await bcrypt.hash(data.newPassword, 12);
    await user.save();
    res.json({ success: true, message: "Password updated" });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ success: false, errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
