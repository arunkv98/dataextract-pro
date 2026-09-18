package com.onebase.extraction;

import java.util.UUID;

public class ExtractionMetrics {
    private String payloadId;
    private long inputPacketSize;
    private int inputTokenSize;
    private int processedTokenSize;
    private int outputTokenSize;
    private int totalTokens;
    private int cacheWriteTokens;
    private int cachedTokens;
    private int reasoningTokens;
    private String aiModel;
    private String aiCostingType;
    private double costPerTransaction;

    private static final double INPUT_PRICE_PER_1K = 0.0015;
    private static final double OUTPUT_PRICE_PER_1K = 0.006;

    public ExtractionMetrics() {
        this.payloadId = UUID.randomUUID().toString();
    }

    public void calculateCost() {
        double inputCost = (inputTokenSize / 1000.0) * INPUT_PRICE_PER_1K;
        double outputCost = (outputTokenSize / 1000.0) * OUTPUT_PRICE_PER_1K;
        this.costPerTransaction = Math.round((inputCost + outputCost) * 10000.0) / 10000.0;
    }

    // Getters and Setters
    public String getPayloadId() { return payloadId; }
    public void setPayloadId(String payloadId) { this.payloadId = payloadId; }

    public long getInputPacketSize() { return inputPacketSize; }
    public void setInputPacketSize(long inputPacketSize) { this.inputPacketSize = inputPacketSize; }

    public int getInputTokenSize() { return inputTokenSize; }
    public void setInputTokenSize(int inputTokenSize) { this.inputTokenSize = inputTokenSize; }

    public int getProcessedTokenSize() { return processedTokenSize; }
    public void setProcessedTokenSize(int processedTokenSize) { this.processedTokenSize = processedTokenSize; }

    public int getOutputTokenSize() { return outputTokenSize; }
    public void setOutputTokenSize(int outputTokenSize) { this.outputTokenSize = outputTokenSize; }

    public int getTotalTokens() { return totalTokens; }
    public void setTotalTokens(int totalTokens) { this.totalTokens = totalTokens; }

    public int getCacheWriteTokens() { return cacheWriteTokens; }
    public void setCacheWriteTokens(int cacheWriteTokens) { this.cacheWriteTokens = cacheWriteTokens; }

    public int getCachedTokens() { return cachedTokens; }
    public void setCachedTokens(int cachedTokens) { this.cachedTokens = cachedTokens; }

    public int getReasoningTokens() { return reasoningTokens; }
    public void setReasoningTokens(int reasoningTokens) { this.reasoningTokens = reasoningTokens; }

    public String getAiModel() { return aiModel; }
    public void setAiModel(String aiModel) { this.aiModel = aiModel; }

    public String getAiCostingType() { return aiCostingType; }
    public void setAiCostingType(String aiCostingType) { this.aiCostingType = aiCostingType; }

    public double getCostPerTransaction() { return costPerTransaction; }
    public void setCostPerTransaction(double costPerTransaction) { this.costPerTransaction = costPerTransaction; }
}
