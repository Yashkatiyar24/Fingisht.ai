import Papa from "papaparse";
import * as XLSX from "xlsx";
import { TransactionRow } from "./types";

export function detectKind(file: File): "csv" | "xlsx" | "unknown" {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (name.endsWith(".csv") || type.includes("text/csv")) return "csv";
  if (
    name.endsWith(".xlsx") || name.endsWith(".xls") ||
    type.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
    type.includes("application/vnd.ms-excel")
  ) return "xlsx";
  return "unknown";
}

export async function parseAny(file: File): Promise<{ rows: TransactionRow[], errors: string[] }> {
  const kind = detectKind(file);
  if (kind === "csv") {
    const text = await file.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  // @ts-ignore - papaparse types are declared in frontend/types/global.d.ts
  return normalize(parsed.data as Record<string,string>[]);
  }
  if (kind === "xlsx") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
  // avoid generic here to keep compatibility with minimal types
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string,string>[];
    return normalize(rows);
  }
  throw new Error(`Unsupported file type: ${file.name}`);
}

function normalize(data: Record<string,string>[]) {
  const errors: string[] = [];
  const rows: TransactionRow[] = [];
  const norm = (s:string) => s.trim().toLowerCase();

  data.forEach((r, i) => {
    const map: Record<string,string> = {};
    Object.keys(r).forEach(k => map[norm(k)] = r[k]);

    const date = map['date'] || map['transaction date'] || map['txn_date'] || map['payment_date'];
    const amountRaw = map['amount'] || map['amt'] || map['transaction amount'];
    const description = map['description'] || map['narration'] || map['memo'] || '';
    const merchant = map['merchant'] || map['vendor'] || map['payee'] || (description.split(' ')[0] || '');

    if (!date || !amountRaw) {
      errors.push(`row ${i+1}: missing date or amount`);
      return;
    }
    const amount = Number(String(amountRaw).replace(/[^0-9.-]+/g, ''));
    if (Number.isNaN(amount)) {
      errors.push(`row ${i+1}: invalid amount ${amountRaw}`);
      return;
    }

    const normalizedDate = new Date(date).toISOString().slice(0,10);
    rows.push({
      date: normalizedDate,
      merchant: merchant,
      description: description,
      amount,
      currency: 'INR',
    } as TransactionRow);
  });

  // de-dupe
  const seen = new Set<string>();
  const deduped = rows.filter(r => {
    const key = `${r.date}|${r.amount}|${(r.merchant||'').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { rows: deduped, errors };
}
