import { api } from "encore.dev/api";
import { Bucket } from "encore.dev/storage/objects";
import db from "../db";

const uploadsBucket = new Bucket("uploads", { public: false });

interface UploadResponse {
  uploadId: number;
  signedUrl: string;
}

// Generates a signed URL for uploading a file
export const getUploadUrl = api<{ filename: string }, UploadResponse>(
  { expose: true, method: "POST", path: "/upload/url" },
  async ({ filename }) => {
    const uploadId = await db.queryRow<{ id: number }>`
      INSERT INTO uploads (filename, status)
      VALUES (${filename}, 'pending')
      RETURNING id
    `;

    const objectName = `${uploadId!.id}/${filename}`;
    const { url } = await uploadsBucket.signedUploadUrl(objectName, { ttl: 3600 });

    return {
      uploadId: uploadId!.id,
      signedUrl: url,
    };
  }
);

interface ProcessUploadParams {
  uploadId: number;
}

interface ProcessUploadResponse {
  success: boolean;
  totalRows: number;
  errors?: string[];
}

// Processes an uploaded CSV file
export const processUpload = api<ProcessUploadParams, ProcessUploadResponse>(
  { expose: true, method: "POST", path: "/upload/:uploadId/process" },
  async ({ uploadId }) => {
    const upload = await db.queryRow<{ filename: string }>`
      SELECT filename FROM uploads WHERE id = ${uploadId}
    `;

    if (!upload) {
      throw new Error("Upload not found");
    }

    const objectName = `${uploadId}/${upload.filename}`;
    const fileData = await uploadsBucket.download(objectName);
    
    // Parse CSV
    const rows = parseCSV(fileData.toString());
    const errors: string[] = [];
    let successCount = 0;

    for (const row of rows) {
      try {
        await db.exec`
          INSERT INTO transactions (date, amount, merchant, description, currency)
          VALUES (${row.date}, ${row.amount}, ${row.merchant}, ${row.description || ''}, ${row.currency || 'INR'})
        `;
        successCount++;
      } catch (err) {
        errors.push(`Row ${successCount + errors.length + 1}: ${err}`);
      }
    }

    await db.exec`
      UPDATE uploads
      SET status = 'processed', processed_at = NOW(), total_rows = ${successCount}, errors = ${JSON.stringify(errors)}
      WHERE id = ${uploadId}
    `;

    return {
      success: errors.length === 0,
      totalRows: successCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
);

function parseCSV(content: string): Array<{
  date: Date;
  amount: number;
  merchant: string;
  description?: string;
  currency?: string;
}> {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const amountIdx = headers.findIndex(h => h.includes('amount'));
  const merchantIdx = headers.findIndex(h => h.includes('merchant') || h.includes('vendor') || h.includes('payee'));
  const descIdx = headers.findIndex(h => h.includes('description') || h.includes('memo'));
  const currencyIdx = headers.findIndex(h => h.includes('currency'));

  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    return {
      date: new Date(cols[dateIdx]),
      amount: parseFloat(cols[amountIdx]),
      merchant: cols[merchantIdx] || 'Unknown',
      description: descIdx >= 0 ? cols[descIdx] : undefined,
      currency: currencyIdx >= 0 ? cols[currencyIdx] : undefined,
    };
  });
}
