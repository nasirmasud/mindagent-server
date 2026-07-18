import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Item from "./models/Item.js";
import User from "./models/User.js";
import { config } from "dotenv";

config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mindagent";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const demoUser = await User.findOne({ email: "demo@mindagent.ai" });
  if (!demoUser) {
    console.log("Creating demo user...");
    const hashed = await bcrypt.hash("demo123", 10);
    await User.create({
      name: "Demo User",
      email: "demo@mindagent.ai",
      password: hashed,
      authProvider: "email",
    });
  }
  const user = await User.findOne({ email: "demo@mindagent.ai" })!;
  console.log(`Using user: ${user!.email}`);

  const existing = await Item.countDocuments();
  if (existing > 0) {
    console.log(`${existing} items already exist, skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  const reports = [
    {
      title: "Q3 Sales Performance Analysis",
      shortDescription: "Strong revenue growth with regional disparities across 4 quarters",
      fullDescription: "Analysis of Q3 2025 sales data reveals a 23% year-over-year revenue increase, driven primarily by the North American and APAC regions. European markets showed modest growth at 8%, while LATAM experienced a 2% decline due to currency fluctuations. The electronics category outperformed all others with 38% growth, suggesting a strategic shift in consumer spending patterns. Inventory turnover improved by 15%, indicating better demand forecasting and supply chain efficiency.",
      sourceFileName: "q3-sales-2025.csv",
      sourceFileType: "csv" as const,
      rowCount: 12450,
      columns: ["Region", "Product", "Revenue", "Units", "Date", "Category", "Discount"],
      parsedPreview: [
        { Region: "North America", Product: "Laptop Pro", Revenue: 45000, Units: 120, Date: "2025-07-15", Category: "Electronics", Discount: "5%" },
        { Region: "Europe", Product: "Wireless Mouse", Revenue: 12000, Units: 400, Date: "2025-07-16", Category: "Accessories", Discount: "10%" },
        { Region: "APAC", Product: "Smartphone X", Revenue: 78000, Units: 250, Date: "2025-07-17", Category: "Electronics", Discount: "0%" },
        { Region: "LATAM", Product: "Tablet Mini", Revenue: 8900, Units: 60, Date: "2025-07-18", Category: "Electronics", Discount: "15%" },
        { Region: "North America", Product: "Bluetooth Speaker", Revenue: 23000, Units: 310, Date: "2025-07-19", Category: "Accessories", Discount: "8%" },
        { Region: "Europe", Product: "Laptop Pro", Revenue: 31000, Units: 85, Date: "2025-07-20", Category: "Electronics", Discount: "3%" },
        { Region: "APAC", Product: "Wireless Mouse", Revenue: 18000, Units: 600, Date: "2025-07-21", Category: "Accessories", Discount: "0%" },
        { Region: "North America", Product: "Smartphone X", Revenue: 92000, Units: 300, Date: "2025-07-22", Category: "Electronics", Discount: "2%" },
        { Region: "EMEA", Product: "Server Rack", Revenue: 67000, Units: 15, Date: "2025-07-23", Category: "Infrastructure", Discount: "12%" },
        { Region: "APAC", Product: "Tablet Mini", Revenue: 14500, Units: 95, Date: "2025-07-24", Category: "Electronics", Discount: "5%" },
      ],
      insights: {
        summary: "Q3 2025 shows strong overall growth at 23% YoY, led by Electronics (+38%) and North American market (+31%). Inventory efficiency improved 15%. Key risk: LATAM decline (-2%) and over-reliance on Electronics category (52% of total revenue).",
        trends: ["Electronics category growing 38% YoY — dominant revenue driver", "North America + APAC account for 71% of total sales", "Discount rate inversely correlated with volume — full-price items sell better", "B2B Infrastructure segment showing steady 12% quarterly growth"],
        kpis: [
          { label: "Total Revenue", value: "$1.2M" },
          { label: "YoY Growth", value: "23%" },
          { label: "Avg Order Value", value: "$312" },
          { label: "Top Region", value: "North America" },
        ],
        risks: ["LATAM revenue declining 2% — currency headwinds", "Electronics concentration risk (52% of revenue)", "Discount rates above 10% eroding margins in EMEA", "Supply chain lead times increasing 3 days vs Q2"],
      },
      chartData: [
        { label: "North America", value: 452000 },
        { label: "APAC", value: 398000 },
        { label: "Europe", value: 215000 },
        { label: "LATAM", value: 89000 },
        { label: "EMEA", value: 67000 },
      ],
    },
    {
      title: "Customer Churn Risk Assessment",
      shortDescription: "12% monthly churn rate identified — 3 key risk segments",
      fullDescription: "Analysis of 50K customer records over 6 months reveals a 12% monthly churn rate, with 3 high-risk segments: users aged 18-25 (22% churn), accounts with zero support tickets (18% churn), and users on basic plans with less than 2 logins per week (15% churn). Retention efforts should prioritize onboarding engagement for new users and proactive support outreach for silent accounts. The predictive model identifies login frequency and support interaction as the strongest churn predictors.",
      sourceFileName: "customer-data-2025.json",
      sourceFileType: "json" as const,
      rowCount: 50230,
      columns: ["userId", "age", "plan", "loginsPerWeek", "supportTickets", "tenureMonths", "churned"],
      parsedPreview: [
        { userId: "USR001", age: 24, plan: "Basic", loginsPerWeek: 1, supportTickets: 0, tenureMonths: 2, churned: true },
        { userId: "USR002", age: 45, plan: "Pro", loginsPerWeek: 7, supportTickets: 3, tenureMonths: 24, churned: false },
        { userId: "USR003", age: 31, plan: "Basic", loginsPerWeek: 2, supportTickets: 1, tenureMonths: 6, churned: false },
        { userId: "USR004", age: 22, plan: "Free", loginsPerWeek: 0, supportTickets: 0, tenureMonths: 1, churned: true },
        { userId: "USR005", age: 52, plan: "Enterprise", loginsPerWeek: 12, supportTickets: 5, tenureMonths: 36, churned: false },
        { userId: "USR006", age: 19, plan: "Free", loginsPerWeek: 1, supportTickets: 0, tenureMonths: 1, churned: true },
        { userId: "USR007", age: 38, plan: "Pro", loginsPerWeek: 5, supportTickets: 2, tenureMonths: 18, churned: false },
        { userId: "USR008", age: 27, plan: "Basic", loginsPerWeek: 3, supportTickets: 0, tenureMonths: 4, churned: false },
        { userId: "USR009", age: 35, plan: "Enterprise", loginsPerWeek: 10, supportTickets: 4, tenureMonths: 12, churned: false },
        { userId: "USR010", age: 20, plan: "Free", loginsPerWeek: 0, supportTickets: 0, tenureMonths: 1, churned: true },
      ],
      insights: {
        summary: "12% monthly churn rate identified. Three high-risk segments: young users (18-25, 22% churn), zero-support-ticket accounts (18% churn), and low-engagement basic plan users (15% churn). Login frequency and support interaction are the strongest retention predictors.",
        trends: ["Users aged 18-25 churn at 22% — highest risk demographic", "Zero support tickets correlates with 18% churn (vs 4% for 2+ tickets)", "Enterprise plan retention is 98% — highest loyalty segment", "First 30 days is the critical churn window (40% of churns occur in month 1)"],
        kpis: [
          { label: "Monthly Churn", value: "12%" },
          { label: "At-Risk Users", value: "8,450" },
          { label: "Avg Lifetime", value: "14 months" },
          { label: "Enterprise Retention", value: "98%" },
        ],
        risks: ["New user onboarding failure — 40% of churn within first 30 days", "Free tier users have near-zero engagement — conversion funnel weakness", "No automated re-engagement triggers for inactive accounts", "Support team bandwidth insufficient for proactive outreach"],
      },
      chartData: [
        { label: "18-25", value: 22 },
        { label: "26-35", value: 10 },
        { label: "36-45", value: 7 },
        { label: "46-55", value: 5 },
        { label: "55+", value: 4 },
      ],
    },
    {
      title: "Employee Satisfaction Survey Analysis",
      shortDescription: "Overall score 7.8/10 — Work-Life Balance rated highest",
      fullDescription: "Analysis of 2,340 employee survey responses reveals an overall satisfaction score of 7.8/10. Work-Life Balance scored highest at 8.6/10, while Career Growth scored lowest at 6.2/10. Department-level analysis shows Engineering (8.4) and HR (8.1) as most satisfied, while Operations (6.8) and Sales (7.0) need attention. Open-ended comments highlight a desire for clearer promotion paths and more cross-team collaboration opportunities.",
      sourceFileName: "employee-survey-2025.xlsx",
      sourceFileType: "xlsx" as const,
      rowCount: 2340,
      columns: ["department", "workLifeBalance", "careerGrowth", "compensation", "management", "overall", "tenure"],
      parsedPreview: [
        { department: "Engineering", workLifeBalance: 8.5, careerGrowth: 7.0, compensation: 8.0, management: 8.5, overall: 8.4, tenure: 3.5 },
        { department: "Sales", workLifeBalance: 7.0, careerGrowth: 6.5, compensation: 9.0, management: 6.0, overall: 7.0, tenure: 2.1 },
        { department: "HR", workLifeBalance: 9.0, careerGrowth: 7.5, compensation: 7.5, management: 8.0, overall: 8.1, tenure: 5.2 },
        { department: "Operations", workLifeBalance: 7.5, careerGrowth: 5.5, compensation: 6.5, management: 6.5, overall: 6.8, tenure: 4.0 },
        { department: "Marketing", workLifeBalance: 8.0, careerGrowth: 6.0, compensation: 7.0, management: 7.5, overall: 7.4, tenure: 2.8 },
        { department: "Engineering", workLifeBalance: 9.0, careerGrowth: 7.5, compensation: 8.5, management: 9.0, overall: 8.8, tenure: 6.0 },
        { department: "Sales", workLifeBalance: 6.5, careerGrowth: 6.0, compensation: 8.5, management: 5.5, overall: 6.7, tenure: 1.5 },
        { department: "Finance", workLifeBalance: 8.0, careerGrowth: 6.5, compensation: 8.0, management: 7.0, overall: 7.6, tenure: 4.5 },
        { department: "Engineering", workLifeBalance: 8.0, careerGrowth: 6.5, compensation: 7.5, management: 8.0, overall: 7.9, tenure: 2.0 },
        { department: "Operations", workLifeBalance: 7.0, careerGrowth: 5.0, compensation: 6.0, management: 6.0, overall: 6.5, tenure: 3.0 },
      ],
      insights: {
        summary: "Overall satisfaction: 7.8/10. Strengths: Work-Life Balance (8.6), Management (7.9). Weaknesses: Career Growth (6.2), Compensation (7.0). Engineering leads at 8.4; Operations needs improvement at 6.8. Key theme from comments: desire for clearer career progression paths.",
        trends: ["Work-Life Balance consistently scores highest across all departments", "Engineering satisfaction increased 0.6 points vs last year — new remote policy working", "Career Growth scores dropped 0.4 points — promotion transparency concern", "Tenure correlates positively with satisfaction (+0.3 per year)"],
        kpis: [
          { label: "Overall Score", value: "7.8 / 10" },
          { label: "Top Department", value: "Engineering (8.4)" },
          { label: "Lowest Score", value: "Career Growth (6.2)" },
          { label: "Response Rate", value: "85%" },
        ],
        risks: ["Career Growth score of 6.2 — top flight risk driver", "Operations department at 6.8 — 30% below company average", "Sales management score of 6.0 — manager training needed", "Tenure below 1 year segment scores 6.5 — onboarding experience gap"],
      },
      chartData: [
        { label: "Engineering", value: 8.4 },
        { label: "HR", value: 8.1 },
        { label: "Finance", value: 7.6 },
        { label: "Marketing", value: 7.4 },
        { label: "Sales", value: 7.0 },
        { label: "Operations", value: 6.8 },
      ],
    },
    {
      title: "Website Performance Metrics Analysis",
      shortDescription: "Page load improved 40% after CDN migration — bounce rate down 12%",
      fullDescription: "Analysis of 2.8M user sessions reveals significant performance improvements following the CDN migration in August. Average page load time dropped from 4.2s to 2.5s (40% improvement). Bounce rate decreased from 48% to 36%, with the largest gains on mobile devices (55% to 39%). Conversion rate improved from 2.1% to 3.4%. Desktop users continue to convert at higher rates (4.1%) compared to mobile (2.8%), but the gap is narrowing.",
      sourceFileName: "web-analytics-aug.csv",
      sourceFileType: "csv" as const,
      rowCount: 2800000,
      columns: ["date", "pageLoadTime", "bounceRate", "conversionRate", "sessions", "deviceType", "source"],
      parsedPreview: [
        { date: "2025-08-01", pageLoadTime: 4.1, bounceRate: 47, conversionRate: 2.2, sessions: 45200, deviceType: "Mobile", source: "Organic" },
        { date: "2025-08-02", pageLoadTime: 4.3, bounceRate: 49, conversionRate: 2.0, sessions: 38900, deviceType: "Desktop", source: "Direct" },
        { date: "2025-08-15", pageLoadTime: 2.4, bounceRate: 36, conversionRate: 3.3, sessions: 48500, deviceType: "Mobile", source: "Organic" },
        { date: "2025-08-16", pageLoadTime: 2.5, bounceRate: 35, conversionRate: 3.5, sessions: 42100, deviceType: "Desktop", source: "Paid" },
        { date: "2025-08-20", pageLoadTime: 2.3, bounceRate: 34, conversionRate: 3.6, sessions: 51000, deviceType: "Mobile", source: "Organic" },
        { date: "2025-08-25", pageLoadTime: 2.6, bounceRate: 37, conversionRate: 3.2, sessions: 46800, deviceType: "Desktop", source: "Referral" },
        { date: "2025-08-28", pageLoadTime: 2.4, bounceRate: 35, conversionRate: 3.5, sessions: 44300, deviceType: "Mobile", source: "Social" },
        { date: "2025-09-01", pageLoadTime: 2.5, bounceRate: 36, conversionRate: 3.4, sessions: 47500, deviceType: "Desktop", source: "Organic" },
        { date: "2025-09-05", pageLoadTime: 2.5, bounceRate: 35, conversionRate: 3.4, sessions: 41200, deviceType: "Mobile", source: "Paid" },
        { date: "2025-09-10", pageLoadTime: 2.4, bounceRate: 34, conversionRate: 3.6, sessions: 48900, deviceType: "Desktop", source: "Direct" },
      ],
      insights: {
        summary: "CDN migration in mid-August improved page load time by 40% (4.2s → 2.5s). Bounce rate dropped 12 points (48% → 36%), with mobile seeing the biggest improvement. Conversion rate rose from 2.1% to 3.4%. Desktop still leads in conversion (4.1% vs 2.8%), but the gap is closing.",
        trends: ["Page load time dropped 40% immediately after CDN migration — no regression", "Mobile bounce rate improved 16 points (55% → 39%) — best gain", "Conversion rate up 62% (2.1% → 3.4%) — strong business impact", "Organic traffic provides highest conversion rate at 3.8% across devices"],
        kpis: [
          { label: "Avg Load Time", value: "2.5s" },
          { label: "Bounce Rate", value: "36%" },
          { label: "Conversion Rate", value: "3.4%" },
          { label: "Monthly Sessions", value: "1.4M" },
        ],
        risks: ["Mobile conversion still lags desktop by 1.3 points", "Paid traffic has highest bounce rate (41%) — ad/targeting audit needed", "Referral traffic declining 8% month-over-month", "Single CDN provider creates vendor lock-in risk"],
      },
      chartData: [
        { label: "Before CDN", value: 4.2 },
        { label: "Week 1 Post", value: 2.8 },
        { label: "Week 2 Post", value: 2.5 },
        { label: "Week 3 Post", value: 2.4 },
        { label: "Week 4 Post", value: 2.5 },
      ],
    },
  ];

  const items = reports.map((r) => ({
    ...r,
    ownerId: user!._id,
    status: "completed" as const,
  }));

  await Item.insertMany(items);
  console.log(`Seeded ${items.length} sample reports for demo user.`);

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
