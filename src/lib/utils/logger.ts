// Simple dev logger — swap for pino in production (see Pino tab)

import { isDev } from "@/config/env";

function formatLog(level: string, data: object, msg: string) {
  if (isDev) {
    const prefix = { info: "ℹ", error: "✗", warn: "⚠" }[level] ?? "·";
    console.log(
      `[fetch] ${prefix} ${msg}`,
      Object.keys(data).length ? data : "",
    );
  } else {
    // JSON line for log aggregators (Datadog, Grafana, etc.)
    console.log(
      JSON.stringify({ level, msg, ...data, t: new Date().toISOString() }),
    );
  }
}

export const log = {
  info: (data: object, msg: string) => formatLog("info", data, msg),
  error: (data: object, msg: string) => formatLog("error", data, msg),
  warn: (data: object, msg: string) => formatLog("warn", data, msg),
};
