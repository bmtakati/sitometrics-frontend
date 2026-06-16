import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { FaFilePdf } from 'react-icons/fa';
import { resolveApiAssetUrl } from '../utils/resolveApiAssetUrl';

/**
 * Preview/download/print modal for documents (primarily PDFs).
 * Download/print avoid fetch() so cross-origin storage URLs are not blocked by CORS.
 * In dev, resolveApiAssetUrl uses /storage/... + Vite proxy (same origin).
 */
const DocumentPreviewModal = ({ isOpen, title, url, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const previewRef = useRef(null);
  const assetUrl = useMemo(() => resolveApiAssetUrl(url || ''), [url]);
  const hasUrl = !!assetUrl;

  useEffect(() => {
    if (isOpen) setLoading(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setLoading(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const safeFilename = (name) => {
    const base = (name || 'document').replace(/[^a-z0-9\-_\. ]/gi, '').trim().replace(/\s+/g, '_');
    return base || 'document';
  };

  const getExtension = (u) => {
    const clean = String(u || '').split('?')[0];
    const match = clean.match(/\.([a-zA-Z0-9]+)$/);
    return match?.[1] ? match[1].toLowerCase() : 'pdf';
  };

  const handleDownload = () => {
    if (!hasUrl || actionLoading) return;
    setActionLoading(true);
    try {
      const a = document.createElement('a');
      a.href = assetUrl;
      a.download = `${safeFilename(title)}.${getExtension(url)}`;
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      window.setTimeout(() => setActionLoading(false), 400);
    }
  };

  const handlePrint = () => {
    if (!hasUrl || actionLoading) return;
    setActionLoading(true);

    const finish = () => setActionLoading(false);

    const tryPrintWindow = (win) => {
      if (!win) return false;
      let finished = false;
      const doneOnce = () => {
        if (finished) return;
        finished = true;
        finish();
      };

      try {
        win.addEventListener('afterprint', doneOnce, { once: true });
      } catch {
        // ignore
      }
      try {
        window.addEventListener('afterprint', doneOnce, { once: true });
      } catch {
        // ignore
      }
      // If neither event fires (some PDF viewers), avoid leaving the button stuck.
      window.setTimeout(doneOnce, 120_000);

      try {
        win.focus();
        win.print();
        return true;
      } catch {
        doneOnce();
        return false;
      }
    };

    // Prefer the visible preview iframe — same document the user already loaded; no teardown during print.
    const previewWin = previewRef.current?.contentWindow;
    if (tryPrintWindow(previewWin)) {
      return;
    }

    // Fallback: hidden iframe (only if preview is not ready). Cleanup only after print closes.
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.title = 'Print document';
    document.body.appendChild(iframe);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try {
        document.body.removeChild(iframe);
      } catch {
        // ignore
      }
      finish();
    };

    iframe.onload = () => {
      window.setTimeout(() => {
        const win = iframe.contentWindow;
        if (!win) {
          cleanup();
          return;
        }
        try {
          win.addEventListener('afterprint', cleanup, { once: true });
        } catch {
          // ignore
        }
        try {
          window.addEventListener('afterprint', cleanup, { once: true });
        } catch {
          // ignore
        }
        window.setTimeout(() => {
          if (!cleaned) cleanup();
        }, 120_000);

        try {
          win.focus();
          win.print();
        } catch {
          cleanup();
        }
      }, 500);
    };

    iframe.src = assetUrl;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg bg-white/90 hover:bg-white transition-colors text-gray-700"
          aria-label="Close"
        >
          <FiX className="w-5 h-5" />
        </button>

        <div className="bg-white dark:bg-gray-900 border-b px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg border flex items-center justify-center bg-red-50 border-red-200">
              <FaFilePdf className="w-5 h-5 text-red-600" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{title || 'Document'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Preview available</p>
            </div>
          </div>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!hasUrl || actionLoading}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                hasUrl
                  ? 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {actionLoading ? 'Please wait...' : 'Download'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!hasUrl || actionLoading || loading}
              className={`px-4 py-2 rounded-lg border text-sm font-semibold ${
                hasUrl
                  ? 'border-gray-300 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed'
                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Print
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900">
          <div className="p-4">
            {loading ? (
              <div className="h-[60vh] flex items-center justify-center text-gray-500 text-sm">
                Loading preview...
              </div>
            ) : null}

            {hasUrl ? (
              <iframe
                ref={previewRef}
                title={title || 'Document preview'}
                src={assetUrl}
                className="w-full h-[60vh] rounded-xl border"
                onLoad={() => setLoading(false)}
              />
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                No document is attached to this guide yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
