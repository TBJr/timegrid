import type { RecurrenceRule, SelectionRange, ZoneEntry } from "@/types";
import { baseMinuteToUtc, dateLabel, formatDateInZone, formatSelectionSummary, formatTime } from "@/lib/time-utils";

function calendarStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function pdfText(value: string) {
  return value.replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7e]/g, "");
}

function pdfLine(text: string, x: number, y: number, size = 12) {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${pdfText(text)}) Tj ET`;
}

function recurrenceToRRule(recurrence?: RecurrenceRule) {
  if (!recurrence || recurrence.frequency === "none") return "";
  const count = Math.max(2, Math.min(999, Math.floor(recurrence.count || 2)));
  if (recurrence.frequency === "daily") return `FREQ=DAILY;COUNT=${count}`;
  if (recurrence.frequency === "weekly") return `FREQ=WEEKLY;COUNT=${count}`;
  if (recurrence.frequency === "biweekly") return `FREQ=WEEKLY;INTERVAL=2;COUNT=${count}`;
  if (recurrence.frequency === "monthly") return `FREQ=MONTHLY;COUNT=${count}`;
  return "";
}

export function googleCalendarUrl(dateIso: string, selection: SelectionRange, zones: ZoneEntry[], anchorTimeZone = "UTC", locale = "en-US", recurrence?: RecurrenceRule) {
  const start = baseMinuteToUtc(dateIso, selection.startMinute, anchorTimeZone);
  const end = baseMinuteToUtc(dateIso, selection.endMinute, anchorTimeZone);
  const rrule = recurrenceToRRule(recurrence);
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", "Team meeting");
  url.searchParams.set("dates", `${calendarStamp(start)}/${calendarStamp(end)}`);
  url.searchParams.set("details", formatSelectionSummary(dateIso, selection, zones, anchorTimeZone, locale));
  if (rrule) url.searchParams.set("recur", `RRULE:${rrule}`);
  return url.toString();
}

export function outlookCalendarUrl(dateIso: string, selection: SelectionRange, zones: ZoneEntry[], anchorTimeZone = "UTC", locale = "en-US") {
  const start = baseMinuteToUtc(dateIso, selection.startMinute, anchorTimeZone);
  const end = baseMinuteToUtc(dateIso, selection.endMinute, anchorTimeZone);
  const url = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  url.searchParams.set("path", "/calendar/action/compose");
  url.searchParams.set("rru", "addevent");
  url.searchParams.set("subject", "Team meeting");
  url.searchParams.set("startdt", start.toISOString());
  url.searchParams.set("enddt", end.toISOString());
  url.searchParams.set("body", formatSelectionSummary(dateIso, selection, zones, anchorTimeZone, locale));
  return url.toString();
}

export function slackSummary(dateIso: string, selection: SelectionRange, zones: ZoneEntry[], anchorTimeZone = "UTC", locale = "en-US") {
  const start = baseMinuteToUtc(dateIso, selection.startMinute, anchorTimeZone);
  const end = baseMinuteToUtc(dateIso, selection.endMinute, anchorTimeZone);
  return [
    `*Meeting time:* ${dateLabel(dateIso, locale)}`,
    ...zones.map((zone) => `• *${zone.label}:* ${formatTime(start, zone.timeZone, locale)}-${formatTime(end, zone.timeZone, locale)} (${formatDateInZone(start, zone.timeZone, locale)})`)
  ].join("\n");
}

export function teamsSummary(dateIso: string, selection: SelectionRange, zones: ZoneEntry[], anchorTimeZone = "UTC", locale = "en-US") {
  const start = baseMinuteToUtc(dateIso, selection.startMinute, anchorTimeZone);
  const end = baseMinuteToUtc(dateIso, selection.endMinute, anchorTimeZone);
  return [
    `Meeting time: ${dateLabel(dateIso, locale)}`,
    ...zones.map((zone) => `- ${zone.label}: ${formatTime(start, zone.timeZone, locale)}-${formatTime(end, zone.timeZone, locale)} (${formatDateInZone(start, zone.timeZone, locale)})`)
  ].join("\n");
}

export function selectedTimeCsv(dateIso: string, selection: SelectionRange, zones: ZoneEntry[], anchorTimeZone = "UTC", locale = "en-US") {
  const start = baseMinuteToUtc(dateIso, selection.startMinute, anchorTimeZone);
  const end = baseMinuteToUtc(dateIso, selection.endMinute, anchorTimeZone);
  const rows = [["Label", "Time zone", "Start", "End", "Local date"]];
  zones.forEach((zone) => {
    rows.push([
      zone.label,
      zone.timeZone,
      formatTime(start, zone.timeZone, locale),
      formatTime(end, zone.timeZone, locale),
      formatDateInZone(start, zone.timeZone, locale)
    ]);
  });
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function selectedTimePngDataUrl(dateIso: string, selection: SelectionRange, zones: ZoneEntry[], anchorTimeZone = "UTC", locale = "en-US") {
  const scale = Math.max(2, Math.ceil(window.devicePixelRatio || 1));
  const width = 1080;
  const rowHeight = 74;
  const height = 250 + zones.length * rowHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.scale(scale, scale);

  const start = baseMinuteToUtc(dateIso, selection.startMinute, anchorTimeZone);
  const end = baseMinuteToUtc(dateIso, selection.endMinute, anchorTimeZone);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(1, "#164e63");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(42, 42, width - 84, height - 84);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  ctx.fillStyle = "#67e8f9";
  ctx.font = "700 24px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("TIMEGRID", 72, 92);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 44px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("Meeting time", 72, 148);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "500 24px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(dateLabel(dateIso, locale), 72, 188);

  ctx.fillStyle = "#ecfeff";
  ctx.font = "700 28px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`${formatTime(start, anchorTimeZone, locale)}-${formatTime(end, anchorTimeZone, locale)} · shown in ${zones[0]?.label ?? "UTC"}`, 72, 226);

  zones.forEach((zone, index) => {
    const y = 270 + index * rowHeight;
    ctx.fillStyle = index % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)";
    ctx.fillRect(72, y - 38, width - 144, 58);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 24px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(zone.label, 96, y);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "500 18px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(`${zone.countryCode ?? zone.region ?? zone.timeZone} · ${formatDateInZone(start, zone.timeZone, locale)}`, 96, y + 24);
    ctx.fillStyle = "#ecfeff";
    ctx.font = "800 28px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${formatTime(start, zone.timeZone, locale)}-${formatTime(end, zone.timeZone, locale)}`, width - 96, y + 8);
    ctx.textAlign = "left";
  });

  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 18px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("Generated locally by TimeGrid", 72, height - 64);

  return canvas.toDataURL("image/png");
}

export function selectedTimePdfBlob(dateIso: string, selection: SelectionRange, zones: ZoneEntry[], anchorTimeZone = "UTC", locale = "en-US") {
  const start = baseMinuteToUtc(dateIso, selection.startMinute, anchorTimeZone);
  const end = baseMinuteToUtc(dateIso, selection.endMinute, anchorTimeZone);
  const pageWidth = 612;
  const pageHeight = 792;
  const lines: string[] = [
    "0.96 0.98 1 rg 0 0 612 792 re f",
    "0.06 0.09 0.16 rg 0 712 612 80 re f",
    pdfLine("TIMEGRID", 48, 748, 12),
    pdfLine("Meeting time", 48, 724, 24),
    pdfLine(dateLabel(dateIso, locale), 48, 682, 14),
    pdfLine(`${formatTime(start, anchorTimeZone, locale)}-${formatTime(end, anchorTimeZone, locale)} shown in ${zones[0]?.label ?? "UTC"}`, 48, 660, 14),
    "0.88 0.92 0.96 rg 48 636 516 1 re f"
  ];

  zones.slice(0, 9).forEach((zone, index) => {
    const y = 598 - index * 54;
    lines.push(index % 2 === 0 ? "1 1 1 rg" : "0.96 0.98 1 rg");
    lines.push(`48 ${y - 22} 516 42 re f`);
    lines.push(pdfLine(zone.label, 66, y, 14));
    lines.push(pdfLine(`${zone.countryCode ?? zone.region ?? zone.timeZone} - ${formatDateInZone(start, zone.timeZone, locale)}`, 66, y - 18, 10));
    lines.push(pdfLine(`${formatTime(start, zone.timeZone, locale)}-${formatTime(end, zone.timeZone, locale)}`, 366, y - 4, 13));
  });

  if (zones.length > 9) {
    lines.push(pdfLine(`+ ${zones.length - 9} more zones in the TimeGrid link`, 66, 96, 11));
  }
  lines.push(pdfLine("Generated locally by TimeGrid", 48, 52, 10));

  const stream = lines.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function createIcs(dateIso: string, selection: SelectionRange, zones: ZoneEntry[], anchorTimeZone = "UTC", locale = "en-US", recurrence?: RecurrenceRule) {
  const start = baseMinuteToUtc(dateIso, selection.startMinute, anchorTimeZone);
  const end = baseMinuteToUtc(dateIso, selection.endMinute, anchorTimeZone);
  const rrule = recurrenceToRRule(recurrence);
  const description = formatSelectionSummary(dateIso, selection, zones, anchorTimeZone, locale).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TimeGrid//Meeting Planner//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@timegrid.local`,
    `DTSTAMP:${calendarStamp(new Date())}`,
    `DTSTART:${calendarStamp(start)}`,
    `DTEND:${calendarStamp(end)}`,
    rrule ? `RRULE:${rrule}` : "",
    "SUMMARY:Team meeting",
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].filter(Boolean).join("\r\n");
}
