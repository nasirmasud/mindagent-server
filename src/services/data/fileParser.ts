import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParseResult {
  rows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
}

export function parseCSV(buffer: Buffer): ParseResult {
  const str = buffer.toString("utf-8");
  const result = Papa.parse<Record<string, unknown>>(str, { header: true, skipEmptyLines: true });
  return { rows: result.data, columns: result.meta.fields || [], rowCount: result.data.length };
}

export function parseXLSX(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { rows, columns, rowCount: rows.length };
}

export function parseJSON(buffer: Buffer): ParseResult {
  const text = buffer.toString("utf-8");
  const parsed = JSON.parse(text);
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { rows, columns, rowCount: rows.length };
}

export function parseFile(buffer: Buffer, mimeType: string): ParseResult {
  if (mimeType === "text/csv") return parseCSV(buffer);
  if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return parseXLSX(buffer);
  if (mimeType === "application/json") return parseJSON(buffer);
  throw new Error("Unsupported file type");
}
