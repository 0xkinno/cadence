'use client';

interface ExportButtonProps {
  jsonString: string;
  shopSlug: string;
}

export default function ExportButton({ jsonString, shopSlug }: ExportButtonProps) {
  function handleDownload() {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadence_traces_${shopSlug}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleDownload}
      className="btn-primary"
      style={{ fontSize: '0.85rem' }}
    >
      Export JSON Traces
    </button>
  );
}
