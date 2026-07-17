import { Router, Response } from "express";
import * as XLSX from "xlsx";
import { protect, AuthRequest } from "../middleware/protect.js";
import { upload } from "../middleware/upload.js";
import { parseFile } from "../services/data/fileParser.js";
import { getAIProvider } from "../services/ai/aiProviderFactory.js";
import DataAnalysis from "../models/DataAnalysis.js";

const router = Router();

router.post("/upload", protect, upload.single("file"), async (req: AuthRequest, res: Response) => {
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

    const analysis = await DataAnalysis.create({
      userId: req.user!._id,
      fileName: req.file.originalname,
      fileType,
      originalRowCount: parsed.rowCount,
      parsedPreview: parsed.rows.slice(0, 10),
    });

    res.json({
      success: true,
      analysisId: analysis._id,
      fileName: analysis.fileName,
      fileType: analysis.fileType,
      rowCount: analysis.originalRowCount,
      columns: parsed.columns,
      preview: analysis.parsedPreview,
    });
  } catch (err: any) {
    if (err.message?.includes("Only CSV")) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});

router.post("/:id/analyze", protect, async (req: AuthRequest, res: Response) => {
  try {
    const analysis = await DataAnalysis.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!analysis) {
      res.status(404).json({ success: false, message: "Analysis not found" });
      return;
    }

    const sample = analysis.parsedPreview.slice(0, 5);
    const prompt = `Analyze this dataset. It has ${analysis.originalRowCount} rows. Here is a sample:\n${JSON.stringify(sample, null, 2)}\n\nReturn a JSON object with: summary (string), trends (string[]), risks (string[]), kpis ({label, value}[]).`;

    const ai = getAIProvider();
    const output = await ai.generateText(prompt, 1000);

    let insights;
    try {
      const cleaned = output.replace(/```json|```/g, "").trim();
      insights = JSON.parse(cleaned);
    } catch {
      insights = { summary: output, trends: [], risks: [], kpis: [] };
    }

    analysis.aiInsights = {
      summary: insights.summary || "",
      trends: insights.trends || [],
      risks: insights.risks || [],
      kpis: insights.kpis || [],
    };
    await analysis.save();

    res.json({ success: true, analysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Analysis failed" });
  }
});

router.get("/", protect, async (req: AuthRequest, res: Response) => {
  try {
    const analyses = await DataAnalysis.find({ userId: req.user!._id })
      .select("fileName fileType originalRowCount createdAt")
      .sort({ createdAt: -1 });
    res.json({ success: true, analyses });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
});

router.get("/:id", protect, async (req: AuthRequest, res: Response) => {
  try {
    const analysis = await DataAnalysis.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!analysis) {
      res.status(404).json({ success: false, message: "Analysis not found" });
      return;
    }
    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch analysis" });
  }
});

router.get("/:id/report", protect, async (req: AuthRequest, res: Response) => {
  try {
    const analysis = await DataAnalysis.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!analysis) {
      res.status(404).json({ success: false, message: "Analysis not found" });
      return;
    }

    const wb = XLSX.utils.book_new();

    const dataSheet = XLSX.utils.json_to_sheet(analysis.parsedPreview);
    XLSX.utils.book_append_sheet(wb, dataSheet, "Data");

    const insightsRows = [
      { Section: "Summary", Content: analysis.aiInsights.summary },
      ...analysis.aiInsights.trends.map((t) => ({ Section: "Trend", Content: t })),
      ...analysis.aiInsights.risks.map((r) => ({ Section: "Risk", Content: r })),
      ...analysis.aiInsights.kpis.map((k) => ({ Section: "KPI", Content: `${k.label}: ${k.value}` })),
    ];
    const insightsSheet = XLSX.utils.json_to_sheet(insightsRows);
    XLSX.utils.book_append_sheet(wb, insightsSheet, "Insights");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${analysis.fileName.replace(/\.[^.]+$/, "")}-analysis.xlsx"`);
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Report generation failed" });
  }
});

export default router;
