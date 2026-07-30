import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { google } from "googleapis";

// Helper to get Google Sheets client auth
async function getGoogleSheetsAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    return null;
  }
  const formattedKey = privateKey.replace(/\\n/g, "\n");
  return new google.auth.JWT(
    clientEmail,
    null,
    formattedKey,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
}

// Helper to overwrite values in a Google Sheet tab
async function saveToGoogleSheets(filename, csvContent) {
  try {
    const auth = await getGoogleSheetsAuth();
    if (!auth) {
      return { success: false, reason: "Google credentials not set in .env.local" };
    }

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = "1QWu1FSZTzVlymyaoeh77HdXnrEKDJRErI0y1ovqc3YA";
    // Strip prefix if any
    const cleanName = filename.replace(/^🟢 \[Sheets\] /i, "");
    const tabName = cleanName.replace(/\.csv$/i, "");

    // 1. Ensure the sheet tab exists
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: { title: tabName }
            }
          }]
        }
      });
    } catch (_) {
      // Tab likely already exists
    }

    // 2. Parse CSV content into an array of rows
    const rows = csvContent.split("\n")
      .map(line => line.split(","))
      .filter(row => row.length > 0 && row[0] !== "");

    // 3. Clear existing content in the tab
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${tabName}'!A:Z`
    });

    // 4. Write new content
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${tabName}'!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rows
      }
    });

    return { success: true, tabName, action: "synced" };
  } catch (err) {
    console.error("Google Sheets Sync Error:", err);
    return { success: false, reason: err.message };
  }
}

// Helper to get target backtests directory
function getBacktestsDir() {
  const targetDir = path.join(process.cwd(), "backtests");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

// Helper to get all CSV files inside the backtests folder and active Google Sheets tabs
async function getCsvFiles() {
  const allFiles = [];

  // 1. Load local files
  try {
    const targetDir = getBacktestsDir();
    if (fs.existsSync(targetDir)) {
      const files = fs.readdirSync(targetDir);
      const csvFiles = files.filter(f => f.endsWith(".csv"));
      for (const filename of csvFiles) {
        const filePath = path.join(targetDir, filename);
        const content = fs.readFileSync(filePath, "utf-8");
        const isArchived = filename.startsWith("[ARCHIVE]");
        allFiles.push({
          name: filename,
          content: content,
          isArchived: isArchived
        });
      }
    }
  } catch (e) {
    console.error("Error reading local backtests:", e);
  }

  // 2. Load Google Sheets tabs
  try {
    const auth = await getGoogleSheetsAuth();
    if (auth) {
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = "1QWu1FSZTzVlymyaoeh77HdXnrEKDJRErI0y1ovqc3YA";
      
      const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetNames = sheetMeta.data.sheets.map(s => s.properties.title);

      if (sheetNames.length > 0) {
        const batchResponse = await sheets.spreadsheets.values.batchGet({
          spreadsheetId,
          ranges: sheetNames.map(name => `'${name}'!A:Z`)
        });

        sheetNames.forEach((name, index) => {
          const valueRange = batchResponse.data.valueRanges[index];
          const rows = valueRange.values || [];
          const csvContent = rows.map(r => r.join(",")).join("\n");
          allFiles.push({
            name: `🟢 [Sheets] ${name}`,
            content: csvContent,
            isGoogleSheet: true,
            sheetTabName: name
          });
        });
      }
    }
  } catch (err) {
    console.error("Error reading Google Sheets tabs:", err);
  }

  return allFiles;
}

// GET: List all CSV files (local & Google Sheet tabs)
export async function GET() {
  try {
    const files = await getCsvFiles();
    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ files: [] });
  }
}

// POST: Add a trade to manual-trades.csv inside backtests folder
export async function POST(req) {
  try {
    const { trade } = await req.json();
    if (!trade) {
      return NextResponse.json({ error: "Missing trade data" }, { status: 400 });
    }

    const filename = "manual-trades.csv";
    const targetDir = getBacktestsDir();
    const filePath = path.join(targetDir, filename);
    
    const headers = "Symbol,Type,Volume,Open Price,Close Price,Open Time,Close Time,Profit\n";
    
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      const pad = (n) => String(n).padStart(2, "0");
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const min = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    };

    const row = `${trade.symbol},${trade.type},${trade.volume},${trade.openPrice},${trade.closePrice},${formatDate(trade.openTime)},${formatDate(trade.closeTime)},${trade.profit}\n`;

    try {
      let fileExists = fs.existsSync(filePath);
      let fileContent = "";
      if (!fileExists) {
        fileContent = headers + row;
        fs.writeFileSync(filePath, fileContent, "utf-8");
      } else {
        fs.appendFileSync(filePath, row, "utf-8");
        fileContent = fs.readFileSync(filePath, "utf-8");
      }
      
      // Sync with Google Sheets
      const gdStatus = await saveToGoogleSheets(filename, fileContent);
      const updatedFiles = await getCsvFiles();

      return NextResponse.json({ 
        success: true, 
        files: updatedFiles, 
        googleDrive: gdStatus 
      });
    } catch (fsErr) {
      return NextResponse.json({ 
        success: true, 
        isReadOnly: true, 
        warning: "Server filesystem is read-only. Falling back to local browser storage." 
      });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Rename, Archive/Unarchive or modify file content
export async function PUT(req) {
  try {
    const { oldName, newName, archive, content } = await req.json();
    const targetDir = getBacktestsDir();

    // If it's a Google Sheet sync, bypass local file paths
    const isGoogleSheet = oldName.startsWith("🟢 [Sheets] ");
    const cleanOldName = oldName.replace(/^🟢 \[Sheets\] /i, "");
    const cleanNewName = newName ? newName.replace(/^🟢 \[Sheets\] /i, "") : null;

    try {
      if (!isGoogleSheet) {
        const oldPath = path.join(targetDir, cleanOldName);
        if (content !== undefined) {
          fs.writeFileSync(oldPath, content, "utf-8");
        } else if (!fs.existsSync(oldPath)) {
          return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        let targetName = cleanNewName || cleanOldName;
        if (archive !== undefined) {
          if (archive) {
            if (!cleanOldName.startsWith("[ARCHIVE] ")) {
              targetName = `[ARCHIVE] ${cleanOldName}`;
            }
          } else {
            if (cleanOldName.startsWith("[ARCHIVE] ")) {
              targetName = cleanOldName.replace("[ARCHIVE] ", "");
            }
          }
        }

        if (targetName && !targetName.endsWith(".csv")) {
          targetName += ".csv";
        }

        if (targetName && targetName !== cleanOldName) {
          const newPath = path.join(targetDir, targetName);
          fs.renameSync(oldPath, newPath);
        }
      }

      // Sync active CSV content with Google Sheets
      const activeContent = content !== undefined ? content : (isGoogleSheet ? "" : fs.readFileSync(path.join(targetDir, cleanNewName || cleanOldName), "utf-8"));
      let gdStatus = null;
      if (activeContent) {
        gdStatus = await saveToGoogleSheets(cleanNewName || cleanOldName, activeContent);
      }

      const updatedFiles = await getCsvFiles();

      return NextResponse.json({ 
        success: true, 
        files: updatedFiles, 
        googleDrive: gdStatus 
      });
    } catch (fsErr) {
      return NextResponse.json({ 
        success: true, 
        isReadOnly: true, 
        warning: "Server filesystem is read-only. File was updated in browser memory." 
      });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a CSV file
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    if (!name) {
      return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
    }

    try {
      const isGoogleSheet = name.startsWith("🟢 [Sheets] ");
      if (!isGoogleSheet) {
        const targetDir = getBacktestsDir();
        const filePath = path.join(targetDir, name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else {
        // If they delete a Google Sheets tab item from UI, we can clear the values or delete the tab via API
        const auth = await getGoogleSheetsAuth();
        if (auth) {
          const sheets = google.sheets({ version: "v4", auth });
          const spreadsheetId = "1QWu1FSZTzVlymyaoeh77HdXnrEKDJRErI0y1ovqc3YA";
          const tabName = name.replace(/^🟢 \[Sheets\] /i, "");
          const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
          const targetSheet = sheetMeta.data.sheets.find(s => s.properties.title === tabName);
          if (targetSheet) {
            await sheets.spreadsheets.batchUpdate({
              spreadsheetId,
              requestBody: {
                requests: [{
                  deleteSheet: {
                    sheetId: targetSheet.properties.sheetId
                  }
                }]
              }
            });
          }
        }
      }

      const updatedFiles = await getCsvFiles();
      return NextResponse.json({ success: true, files: updatedFiles });
    } catch (fsErr) {
      return NextResponse.json({ 
        success: true, 
        isReadOnly: true, 
        warning: "Server filesystem is read-only. File was removed from browser memory." 
      });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
