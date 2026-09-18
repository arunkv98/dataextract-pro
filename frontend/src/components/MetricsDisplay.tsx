import React from 'react';

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

interface MetricsDisplayProps {
  metrics: Metrics;
}

export function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatCost = (cost: number) => {
    return '$' + cost.toFixed(4);
  };

  return (
    <div className="metrics-panel">
      <div className="metrics-header">
        <span className="metrics-icon">📊</span>
        <span className="metrics-title">API Metrics</span>
      </div>
      <div className="metrics-grid">
        <div className="metric-item">
          <span className="metric-label">Payload ID</span>
          <span className="metric-value metric-id">{metrics.payloadId.slice(0, 8)}...</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Input Size</span>
          <span className="metric-value">{formatBytes(metrics.inputPacketSize)}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Input Tokens</span>
          <span className="metric-value">{metrics.inputTokenSize.toLocaleString()}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Output Tokens</span>
          <span className="metric-value">{metrics.outputTokenSize.toLocaleString()}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Total Tokens</span>
          <span className="metric-value">{metrics.totalTokens.toLocaleString()}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Reasoning Tokens</span>
          <span className="metric-value">{metrics.reasoningTokens.toLocaleString()}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Cache Write</span>
          <span className="metric-value">{metrics.cacheWriteTokens.toLocaleString()}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Cached</span>
          <span className="metric-value">{metrics.cachedTokens.toLocaleString()}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">AI Model</span>
          <span className="metric-value">{metrics.aiModel}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Costing Type</span>
          <span className="metric-value">{metrics.aiCostingType}</span>
        </div>
        <div className="metric-item metric-cost">
          <span className="metric-label">Cost per Transaction</span>
          <span className="metric-value metric-cost-value">{formatCost(metrics.costPerTransaction)}</span>
        </div>
      </div>
    </div>
  );
}
