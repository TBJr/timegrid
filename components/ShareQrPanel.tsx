"use client";

import QRCode from "qrcode";
import { Download, QrCode } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ShareQrPanelProps = {
  currentUrl: string;
  editableUrl: string;
  readOnlyUrl: string;
};

type QrMode = "current" | "edit" | "readOnly";

export function ShareQrPanel({ currentUrl, editableUrl, readOnlyUrl }: ShareQrPanelProps) {
  const [mode, setMode] = useState<QrMode>("current");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");
  const url = mode === "edit" ? editableUrl : mode === "readOnly" ? readOnlyUrl : currentUrl;

  const modeLabel = useMemo(() => {
    if (mode === "edit") return "editable";
    if (mode === "readOnly") return "read-only";
    return "current";
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    setError("");
    if (!url) return;
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 224,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    })
      .then((nextDataUrl) => {
        if (!cancelled) setDataUrl(nextDataUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl("");
          setError("This link is too large for a QR code.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  function downloadQr() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `timegrid-${modeLabel}-qr.png`;
    link.click();
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-soft" aria-labelledby="share-qr-title">
      <div className="mb-3 flex items-center gap-2">
        <QrCode className="h-4 w-4 text-primary" />
        <h2 id="share-qr-title" className="text-sm font-semibold">
          QR share
        </h2>
      </div>
      <div className="mb-3 grid grid-cols-3 rounded-md border border-border bg-background p-1">
        {(["current", "edit", "readOnly"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            className={cn(
              "h-8 rounded text-xs font-semibold transition",
              mode === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {option === "readOnly" ? "Read" : option === "edit" ? "Edit" : "Current"}
          </button>
        ))}
      </div>
      <div className="grid place-items-center rounded-md border border-border bg-white p-3">
        {dataUrl ? <img src={dataUrl} alt={`${modeLabel} share QR code`} className="h-56 w-56" /> : <div className="h-56 w-56" />}
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-destructive">{error}</p> : null}
      <button
        type="button"
        onClick={downloadQr}
        disabled={!dataUrl}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <Download className="h-4 w-4" />
        Download PNG
      </button>
    </section>
  );
}
