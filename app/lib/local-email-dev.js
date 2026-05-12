import { promises as fs } from "node:fs";
import path from "node:path";

const LOG_FILE_PATH = path.join(process.cwd(), ".local-email-send-log.json");

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function readLocalEmailSendLog() {
  try {
    const file = await fs.readFile(LOG_FILE_PATH, "utf8");
    const parsed = JSON.parse(file);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

export async function getLocalEmailSendCountForToday() {
  const log = await readLocalEmailSendLog();
  const todayKey = getTodayKey();
  return Number(log?.[todayKey]?.count || 0);
}

export async function incrementLocalEmailSendCount(count) {
  const log = await readLocalEmailSendLog();
  const todayKey = getTodayKey();
  const currentCount = Number(log?.[todayKey]?.count || 0);

  log[todayKey] = {
    count: currentCount + count,
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(LOG_FILE_PATH, `${JSON.stringify(log, null, 2)}\n`, "utf8");

  return log[todayKey].count;
}

export async function getLocalEmailSendWindow(dailyCap) {
  const log = await readLocalEmailSendLog();
  const todayKey = getTodayKey();
  const todayEntry = log?.[todayKey] || {};
  const countToday = Number(todayEntry.count || 0);
  const remainingToday = Math.max(Number(dailyCap) - countToday, 0);
  const nextSafeSendAt =
    remainingToday > 0 || !todayEntry.updatedAt
      ? null
      : new Date(new Date(todayEntry.updatedAt).getTime() + 24 * 60 * 60 * 1000);

  return {
    countToday,
    remainingToday,
    nextSafeSendAt: nextSafeSendAt ? nextSafeSendAt.toISOString() : null,
  };
}
