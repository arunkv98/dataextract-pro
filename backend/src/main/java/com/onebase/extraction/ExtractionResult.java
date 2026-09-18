package com.onebase.extraction;

import com.fasterxml.jackson.databind.JsonNode;

public class ExtractionResult {
    private JsonNode data;
    private ExtractionMetrics metrics;

    public ExtractionResult(JsonNode data, ExtractionMetrics metrics) {
        this.data = data;
        this.metrics = metrics;
    }

    public JsonNode getData() { return data; }
    public ExtractionMetrics getMetrics() { return metrics; }
}
