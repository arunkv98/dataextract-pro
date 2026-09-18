import React, { useRef, useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface HighlightBox {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}

interface PDFPreviewProps {
  fileUrl: string;
  fileName: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  highlights: HighlightBox[];
  searchText?: string;
}

export function PDFPreview({ fileUrl, fileName, currentPage, totalPages, onPageChange, searchText }: PDFPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(560);
  const [searchHighlights, setSearchHighlights] = useState<HighlightBox[]>([]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 2);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (!searchText || !fileUrl) {
      setSearchHighlights([]);
      return;
    }
    findTextOnPage(searchText);
  }, [searchText, currentPage, fileUrl]);

  const findTextOnPage = async (search: string) => {
    try {
      const pdf = await pdfjs.getDocument({ url: fileUrl }).promise;
      const page = await pdf.getPage(currentPage);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });

      const lowerSearch = search.toLowerCase().trim();
      if (!lowerSearch) {
        setSearchHighlights([]);
        return;
      }

      const items: any[] = [];

      textContent.items.forEach((item: any) => {
        const itemText = item.str.toLowerCase().trim();
        if (!itemText) return;

        let matched = false;

        if (itemText.includes(lowerSearch)) {
          matched = true;
        }

        if (!matched) {
          const searchClean = lowerSearch.replace(/[-\/\.]/g, '');
          const itemClean = itemText.replace(/[-\/\.]/g, '');
          if (itemClean.includes(searchClean)) {
            matched = true;
          }
        }

        if (!matched) {
          const searchNums = lowerSearch.replace(/\D/g, '');
          const itemNums = itemText.replace(/\D/g, '');
          if (searchNums.length >= 4 && itemNums.includes(searchNums)) {
            matched = true;
          }
        }

        if (matched) {
          const tx = item.transform;
          const scale = containerWidth / viewport.width;
          const x = tx[4] * scale;
          const y = (viewport.height - tx[5] - item.height) * scale;
          const w = item.width * scale;
          const h = item.height * scale;
          items.push({
            page: currentPage,
            x: x,
            y: y,
            w: w,
            h: h,
            label: item.str
          });
        }
      });

      console.log(`Text search "${search}": found ${items.length} matches`, items);
      setSearchHighlights(items);
    } catch (err) {
      console.error('Text search error:', err);
      setSearchHighlights([]);
    }
  };

  return (
    <div className="pdf-preview" ref={containerRef}>
      <div className="pdf-header">
        <span className="pdf-icon">📄</span>
        <span className="pdf-name">{fileName}</span>
        {totalPages > 1 && (
          <div className="pdf-page-nav">
            <button
              className="pdf-nav-btn"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              ← Prev
            </button>
            <span className="pdf-page-info">{currentPage} / {totalPages}</span>
            <button
              className="pdf-nav-btn"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
      <div className="pdf-viewer" style={{ position: 'relative' }}>
        <Document file={fileUrl}>
          <Page
            pageNumber={currentPage}
            width={containerWidth}
            renderTextLayer={true}
            renderAnnotationLayer={false}
          />
        </Document>
        {searchText && searchHighlights.map((highlight, index) => (
          <div
            key={index}
            className="pdf-highlight-box"
            style={{
              position: 'absolute',
              left: `${highlight.x}px`,
              top: `${highlight.y}px`,
              width: `${highlight.w}px`,
              height: `${highlight.h}px`,
            }}
            title={highlight.label || ''}
          />
        ))}
      </div>
    </div>
  );
}
