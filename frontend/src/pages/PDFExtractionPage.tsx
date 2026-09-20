import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { FileUpload } from '../components/FileUpload';
import { PDFPreview } from '../components/PDFPreview';
import { ExtractedData } from '../components/ExtractedData';
import { MetricsDisplay } from '../components/MetricsDisplay';
import { compressAndEncrypt, decryptAndDecompress } from '../utils/crypto';

const SECURE_API_URL = import.meta.env.VITE_SECURE_API_URL || 'http://localhost:8080/api/extract-secure';

interface Metrics {
  payloadId: string;
  inputPacketSize: number;
  inputTokenSize: number;
  processedTokenSize: number;
  outputTokenSize: number;
  totalTokens: number;
  cacheWriteTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  aiModel: string;
  aiCostingType: string;
  costPerTransaction: number;
}

interface PageData {
  pageNumber: number;
  data?: Record<string, any>;
  error?: string;
}

interface ExtractionResult {
  pages: PageData[];
  totalPages: number;
  metrics?: Metrics;
}

export function PDFExtractionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [searchText, setSearchText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setIsLoading(true);
    setError(null);
    setFile(selectedFile);
    setSelectedPage(1);
    setSearchText('');

    const url = URL.createObjectURL(selectedFile);
    setFileUrl(url);

    console.log('Uploading file:', selectedFile.name, 'Size:', selectedFile.size);

    try {
      // Read PDF as base64
      const arrayBuffer = await selectedFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Build payload
      const payload = JSON.stringify({
        pdf: base64,
        fileName: selectedFile.name
      });

      console.log('Original payload size:', payload.length, 'bytes');

      // Compress + encrypt
      const encrypted = await compressAndEncrypt(payload);
      console.log('Encrypted payload size:', encrypted.byteLength, 'bytes');
      console.log('Compression ratio:', ((1 - encrypted.byteLength / payload.length) * 100).toFixed(1) + '%');

      // Send encrypted
      const response = await fetch(SECURE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: encrypted,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error('Extraction failed');
      }

      // Decrypt response
      const responseBuffer = await response.arrayBuffer();
      console.log('Encrypted response size:', responseBuffer.byteLength, 'bytes');

      const decryptedJson = await decryptAndDecompress(responseBuffer);
      console.log('Decrypted response size:', decryptedJson.length, 'bytes');

      const data: ExtractionResult = JSON.parse(decryptedJson);
      console.log('API Response:', JSON.stringify(data, null, 2));

      setResult(data);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract data');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (result?.totalPages || 1)) {
      setSelectedPage(page);
      setSearchText('');
    }
  };

  const handleHighlight = (text: string | null) => {
    setSearchText(text || '');
  };



  
  const selectedPageData = result?.pages.find(p => p.pageNumber === selectedPage);

  return (
    <>
      <Header />
      <div className="extraction-page">
        <div className="extraction-header">
          <Link to="/" className="back-link">← Back to Home</Link>
        </div>

        <div className="extraction-content">
          {!file ? (
            <div className="upload-section">
              <FileUpload onFileSelect={handleFileSelect} />
            </div>
          ) : isLoading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Extracting data from PDF...</p>
              <p className="loading-sub">Using OpenAI Responses API</p>
            </div>
          ) : error ? (
            <div className="error-section">
              <div className="error-box">
                <span className="error-icon">⚠️</span>
                <p className="error-title">Extraction Failed</p>
                <p className="error-message">{error}</p>
                <button className="retry-btn" onClick={() => { setFile(null); setResult(null); setError(null); }}>
                  Try Again
                </button>
              </div>
            </div>
          ) : result ? (
            <div className="result-section">
              {metrics && <MetricsDisplay metrics={metrics} />}
              <div className="result-grid">
                <div className="result-left">
                  {fileUrl && file && (
                    <PDFPreview
                      fileUrl={fileUrl}
                      fileName={file.name}
                      currentPage={selectedPage}
                      totalPages={result.totalPages}
                      onPageChange={handlePageChange}
                      highlights={[]}
                      searchText={searchText}
                    />
                  )}
                </div>
                <div className="result-right">
                  {selectedPageData?.error ? (
                    <div className="page-error">
                      <span className="error-icon">⚠️</span>
                      <p>Extraction failed for this page</p>
                      <p className="error-detail">{selectedPageData.error}</p>
                    </div>
                  ) : selectedPageData?.data ? (
                    <ExtractedData data={selectedPageData.data} onHighlight={handleHighlight} />
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
