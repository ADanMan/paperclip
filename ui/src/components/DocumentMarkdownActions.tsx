import { useEffect, useRef, useState } from "react";
import type { IssueDocument } from "@paperclipai/shared";
import { Check, Copy, Download } from "lucide-react";
import { copyTextToClipboard } from "@/lib/clipboard";
import { Button } from "@/components/ui/button";

export function DocumentMarkdownActions({ document }: { document: IssueDocument }) {
  const { issueId, key: documentKey } = document;
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTargetRef = useRef({ issueId, documentKey });

  useEffect(() => {
    activeTargetRef.current = { issueId, documentKey };
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopied(false);
    setCopyFailed(false);
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, [issueId, documentKey]);

  const handleCopy = async () => {
    if (document.body == null) return;
    const target = { issueId, documentKey };
    const isTargetActive = () =>
      activeTargetRef.current.issueId === target.issueId &&
      activeTargetRef.current.documentKey === target.documentKey;

    try {
      await copyTextToClipboard(document.body);
      if (!isTargetActive()) return;
      setCopyFailed(false);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        if (isTargetActive()) setCopied(false);
      }, 1500);
    } catch {
      if (!isTargetActive()) return;
      setCopied(false);
      setCopyFailed(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        if (isTargetActive()) setCopyFailed(false);
      }, 2000);
    }
  };

  const handleDownload = () => {
    if (document.body == null) return;
    const blob = new Blob([document.body], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    const safeTitle = (document.title?.trim() || document.key || "document")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_-]+/gu, "-")
      .replace(/^-+|-+$/g, "");
    link.download = `${safeTitle || "document"}.md`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2.5 text-xs font-normal flex items-center gap-1.5 cursor-pointer"
        onClick={handleCopy}
        title={copyFailed ? "Failed to copy" : "Copy Markdown"}
        aria-label={copyFailed ? "Failed to copy" : "Copy Markdown"}
      >
        {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        <span>{copyFailed ? "Failed" : copied ? "Copied" : "Copy"}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2.5 text-xs font-normal flex items-center gap-1.5 cursor-pointer"
        onClick={handleDownload}
        title="Download Markdown"
        aria-label="Download Markdown"
      >
        <Download className="size-3.5" aria-hidden />
        <span>Download</span>
      </Button>
    </div>
  );
}
