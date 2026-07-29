import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Helper to get target backtests directory
function getBacktestsDir() {
  const targetDir = path.join(process.cwd(), "backtests");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

// Helper to get all CSV files inside the backtests folder
function getCsvFiles() {
  try {
    const targetDir = getBacktestsDir();
    const files = fs.readdirSync(targetDir);
    const csvFiles = files.filter(f => f.endsWith(".csv"));
    
    return csvFiles.map(filename => {
      const filePath = path.join(targetDir, filename);
      const content = fs.readFileSync(filePath, "utf-8");
      const isArchived = filename.startsWith("[ARCHIVE]");
      return {
        name: filename,
        content: content,
        isArchived: isArchived
      };
    });
  } catch (e) {
    return [];
  }
}

// GET: List all CSV files in backtests folder
export async function GET() {
  try {
    const files = getCsvFiles();
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
      if (!fileExists) {
        fs.writeFileSync(filePath, headers + row, "utf-8");
      } else {
        fs.appendFileSync(filePath, row, "utf-8");
      }
      return NextResponse.json({ success: true, files: getCsvFiles() });
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

// PUT: Rename, Archive/Unarchive or modify file content in backtests folder
export async function PUT(req) {
  try {
    const { oldName, newName, archive, content } = await req.json();
    const targetDir = getBacktestsDir();
    const oldPath = path.join(targetDir, oldName);

    try {
      if (content !== undefined) {
        fs.writeFileSync(oldPath, content, "utf-8");
      } else if (!fs.existsSync(oldPath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      let targetName = newName;
      if (archive !== undefined) {
        if (archive) {
          if (!oldName.startsWith("[ARCHIVE] ")) {
            targetName = `[ARCHIVE] ${oldName}`;
          } else {
            targetName = oldName;
          }
        } else {
          if (oldName.startsWith("[ARCHIVE] ")) {
            targetName = oldName.replace("[ARCHIVE] ", "");
          } else {
            targetName = oldName;
          }
        }
      }

      if (targetName && !targetName.endsWith(".csv")) {
        targetName += ".csv";
      }

      if (targetName && targetName !== oldName) {
        const newPath = path.join(targetDir, targetName);
        fs.renameSync(oldPath, newPath);
      }

      return NextResponse.json({ success: true, files: getCsvFiles() });
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

// DELETE: Delete a CSV file in backtests folder
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    if (!name) {
      return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
    }

    try {
      const targetDir = getBacktestsDir();
      const filePath = path.join(targetDir, name);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return NextResponse.json({ success: true, files: getCsvFiles() });
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
