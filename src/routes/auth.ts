import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Item from "../models/Item.js";
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
