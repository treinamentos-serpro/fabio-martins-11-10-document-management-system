import { useState } from 'react';

export default function DownloadButton({ document, onDownload }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleClick() {
    setIsDownloading(true);
    try {
      await onDownload(document);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button type="button" className="download-button" onClick={handleClick} disabled={isDownloading}>
      {isDownloading ? 'Baixando...' : 'Baixar'} <span aria-hidden="true">↗</span>
    </button>
  );
}
