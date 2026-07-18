import { Router, Response } from "express";
import Item from "../models/Item.js";
import { protect, AuthRequest } from "../middleware/protect.js";
import { upload } from "../middleware/upload.js";
import { parseFile } from "../services/data/fileParser.js";
import { getAIProvider } from "../services/ai/aiProviderFactory.js";

const router = Router();

const ANALYSIS_PROMPT = `Analyze this dataset. It has {rowCount} rows. Columns: {columns}.
Here is a sample (first {sampleCount} rows):
{sampleJson}

Return a JSON object with these exact fields:
- "title": a short, descriptive title for this analysis report (max 8 words)
- "shortDescription": one-sentence summary of what this data shows (max 20 words)
- "fullDescription": a detailed narrative analysis of the data (3-5 sentences covering trends, patterns, and notable observations)
- "summary": a concise one-paragraph summary of key findings
- "trends": array of strings, each describing an identified trend
- "kpis": array of {label: string, value: string} representing key metrics found
- "risks": array of strings, each describing a potential risk or concern
- "chartData": array of {label: string, value: number} suitable for a bar chart (pick the most interesting numeric column, aggregate if needed, max 10 items)
`;

router.get("/", async (req, res: Response) => {
  try {
    const {
      search,
      fileType,
      dateFrom,
      dateTo,
      sort = "newest",
      page = "1",
      limit = "12",
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
      ];
    }

    if (fileType && ["csv", "xlsx", "json"].includes(fileType)) {
      filter.sourceFileType = fileType;
    }

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);
      filter.createdAt = dateFilter;
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "mostRows") sortOption = { rowCount: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Item.find(filter)
        .populate("ownerId", "name email")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Item.countDocuments(filter),
    ]);

    res.json({
      success: true,
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch items" });
  }
});

router.get("/my", protect, async (req: AuthRequest, res: Response) => {
  const items = await Item.find({ ownerId: req.user!._id });
  res.json({ success: true, items });
});

router.post("/", protect, upload.single("file"), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    const mimeType = req.file.mimetype as "text/csv" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "application/json";
    const parsed = parseFile(req.file.buffer, mimeType);

    if (parsed.rowCount === 0) {
      res.status(400).json({ success: false, message: "File is empty or could not be parsed" });
      return;
    }

    const fileType = mimeType === "text/csv" ? "csv" : mimeType.includes("spreadsheet") ? "xlsx" : "json";

    const sample = parsed.rows.slice(0, 5);
    const prompt = ANALYSIS_PROMPT
      .replace("{rowCount}", String(parsed.rowCount))
      .replace("{columns}", parsed.columns.join(", "))
      .replace("{sampleCount}", String(sample.length))
      .replace("{sampleJson}", JSON.stringify(sample, null, 2));

    const ai = getAIProvider();
    const output = await ai.generateText(prompt, 1500);

    let parsedAI;
    try {
      const cleaned = output.replace(/```json|```/g, "").trim();
      parsedAI = JSON.parse(cleaned);
    } catch {
      parsedAI = {
        title: `Analysis of ${req.file.originalname}`,
        shortDescription: `${parsed.rowCount} rows analyzed`,
        fullDescription: output,
        summary: output,
        trends: [],
        kpis: [],
        risks: [],
        chartData: [],
      };
    }

    const chartData = Array.isArray(parsedAI.chartData) ? parsedAI.chartData.slice(0, 10) : [];
    if (chartData.length === 0 && parsed.columns.length > 0) {
      const firstNumericCol = parsed.columns.find((col) =>
        parsed.rows.some((r) => typeof r[col] === "number")
      );
      if (firstNumericCol) {
        const grouped = new Map<string, number>();
        for (const row of parsed.rows.slice(0, 10)) {
          const label = String(row[parsed.columns[0]] ?? `Item ${grouped.size + 1}`);
          const val = Number(row[firstNumericCol]) || 0;
          grouped.set(label, (grouped.get(label) || 0) + val);
        }
        grouped.forEach((value, label) => chartData.push({ label, value }));
      }
    }

    const item = await Item.create({
      ownerId: req.user!._id,
      title: parsedAI.title || `Analysis of ${req.file.originalname}`,
      shortDescription: parsedAI.shortDescription || `${parsed.rowCount} rows analyzed`,
      fullDescription: parsedAI.fullDescription || "",
      sourceFileName: req.file.originalname,
      sourceFileType: fileType,
      rowCount: parsed.rowCount,
      columns: parsed.columns,
      parsedPreview: parsed.rows.slice(0, 10),
      insights: {
        summary: parsedAI.summary || "",
        trends: parsedAI.trends || [],
        kpis: parsedAI.kpis || [],
        risks: parsedAI.risks || [],
      },
      chartData,
      status: "completed",
    });

    res.status(201).json({ success: true, item });
  } catch (err: any) {
    if (err.message?.includes("Only CSV")) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ success: false, message: "Upload and analysis failed" });
  }
});

router.put("/:id", protect, async (req: AuthRequest, res: Response) => {
  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user!._id },
    req.body,
    { new: true }
  );
  if (!item) {
    res.status(404).json({ success: false, message: "Item not found" });
    return;
  }
  res.json({ success: true, item });
});

router.delete("/:id", protect, async (req: AuthRequest, res: Response) => {
  const item = await Item.findOneAndDelete({
    _id: req.params.id,
    ownerId: req.user!._id,
  });
  if (!item) {
    res.status(404).json({ success: false, message: "Item not found" });
    return;
  }
  res.json({ success: true, message: "Deleted" });
});

export default router;
