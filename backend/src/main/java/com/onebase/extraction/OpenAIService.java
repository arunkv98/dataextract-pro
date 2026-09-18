package com.onebase.extraction;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.time.Duration;
import java.util.UUID;

@Service
public class OpenAIService {

    private static final String API_KEY = System.getenv("OPENAI_API_KEY");

    private static final String MODEL = "gpt-5.6-luna";

    private final ObjectMapper mapper = new ObjectMapper();

    private HttpClient createClient() {
        return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    private HttpResponse<String> sendWithRetry(HttpRequest request, int maxRetries) throws Exception {
        Exception lastException = null;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                HttpClient client = createClient();
                return client.send(request, HttpResponse.BodyHandlers.ofString());
            } catch (Exception e) {
                lastException = e;
                System.out.println("Attempt " + attempt + " failed: " + e.getMessage());
                if (attempt < maxRetries) {
                    System.out.println("Retrying in 2 seconds...");
                    Thread.sleep(2000);
                }
            }
        }
        throw lastException;
    }

    public ExtractionResult extractInvoice(File pdf) throws Exception {
        System.out.println("========== OPENAI SERVICE ==========");
        System.out.println("Processing file: " + pdf.getName());

        if (API_KEY == null || API_KEY.isEmpty()) {
            throw new RuntimeException("OPENAI_API_KEY environment variable is not set");
        }

        ExtractionMetrics metrics = new ExtractionMetrics();
        metrics.setAiModel(MODEL);
        metrics.setAiCostingType("per-token");

        // STEP 1 - Upload PDF
        System.out.println("STEP 1: Uploading PDF to OpenAI...");
        String boundary = "----JavaBoundary" + UUID.randomUUID();
        byte[] fileBytes = Files.readAllBytes(pdf.toPath());
        System.out.println("File size: " + fileBytes.length + " bytes");
        metrics.setInputPacketSize(fileBytes.length);

        String fileHeader =
                "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"purpose\"\r\n\r\n"
                + "user_data\r\n"
                + "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"file\"; filename=\""
                + pdf.getName() + "\"\r\n"
                + "Content-Type: application/pdf\r\n\r\n";

        String fileFooter = "\r\n--" + boundary + "--\r\n";

        byte[] headerBytes = fileHeader.getBytes();
        byte[] footerBytes = fileFooter.getBytes();
        byte[] uploadBody = new byte[headerBytes.length + fileBytes.length + footerBytes.length];

        System.arraycopy(headerBytes, 0, uploadBody, 0, headerBytes.length);
        System.arraycopy(fileBytes, 0, uploadBody, headerBytes.length, fileBytes.length);
        System.arraycopy(footerBytes, 0, uploadBody, headerBytes.length + fileBytes.length, footerBytes.length);

        HttpRequest uploadRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/files"))
                .header("Authorization", "Bearer " + API_KEY)
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(uploadBody))
                .timeout(Duration.ofSeconds(60))
                .build();

        HttpResponse<String> uploadResponse = sendWithRetry(uploadRequest, 3);

        System.out.println("Upload response status: " + uploadResponse.statusCode());

        if (uploadResponse.statusCode() / 100 != 2) {
            System.out.println("Upload failed: " + uploadResponse.body());
            throw new RuntimeException("OpenAI file upload failed: " + uploadResponse.body());
        }

        JsonNode uploadJson = mapper.readTree(uploadResponse.body());
        String fileId = uploadJson.get("id").asText();
        System.out.println("File uploaded successfully. File ID: " + fileId);

        // STEP 2 - Prompt
        System.out.println("STEP 2: Building prompt...");
        String prompt = """
                You are an expert Accounts Payable invoice extraction engine.

                Analyze the supplied invoice PDF.

                Extract the invoice into AP PCP Global v2.1.

                IMPORTANT:

                Preserve the following four base sections exactly:

                invoiceHeader
                lineItem
                poHeader
                supplierHeader

                Do not remove fields.

                Do not rename fields.

                Do not flatten the structure.

                Do not invent information.

                Extract every invoice line.

                Extract:

                - invoice number
                - invoice date
                - due date
                - supplier
                - buyer
                - addresses
                - PO information
                - payment terms
                - currency
                - line items
                - quantity
                - unit price
                - description
                - HSN
                - SAC
                - discount
                - freight
                - tax
                - subtotal
                - total
                - amount due

                Detect the applicable tax jurisdiction.

                For India extract:

                GSTIN
                CGST
                SGST
                IGST
                CESS
                HSN
                SAC
                place of supply
                reverse charge
                IRN
                acknowledgement information

                For Canada extract:

                GST
                HST
                PST
                QST
                province
                GST/HST registration number

                For EU and UK extract VAT.

                For Australia extract GST.

                For USA extract applicable sales taxes.

                Keep legacy PCP fields and new PCP fields consistent.

                Normalize dates to YYYY-MM-DD.

                Use ISO 4217 currency codes where possible.

                Missing string = ""
                Missing number = 0
                Missing boolean = false
                Missing array = []

                Return ONLY the JSON object.

                Do not return markdown.

                Do not return ```json.

                Do not explain anything.
                """;

        // STEP 3 - Build Responses API JSON
        var root = mapper.createObjectNode();
        root.put("model", MODEL);
        root.put("instructions", prompt);

        var input = mapper.createArrayNode();
        var message = mapper.createObjectNode();
        message.put("role", "user");

        var content = mapper.createArrayNode();

        var fileContent = mapper.createObjectNode();
        fileContent.put("type", "input_file");
        fileContent.put("file_id", fileId);
        content.add(fileContent);

        var textContent = mapper.createObjectNode();
        textContent.put("type", "input_text");
        textContent.put("text", "Extract this invoice into AP PCP Global v2.1.");
        content.add(textContent);

        message.set("content", content);
        input.add(message);
        root.set("input", input);

        String requestJson = mapper.writeValueAsString(root);

        System.out.println("STEP 3: Request JSON built");

        // STEP 4 - Call Responses API
        System.out.println("STEP 4: Calling OpenAI Responses API...");
        HttpRequest responseRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/responses"))
                .header("Authorization", "Bearer " + API_KEY)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .timeout(Duration.ofSeconds(120))
                .build();

        HttpResponse<String> response = sendWithRetry(responseRequest, 3);

        System.out.println("Response status: " + response.statusCode());
        System.out.println("========== OPENAI RAW RESPONSE ==========");
        System.out.println(response.body());
        System.out.println("========== END RAW RESPONSE ==========");

        if (response.statusCode() / 100 != 2) {
            System.out.println("API Error: " + response.body());
            throw new RuntimeException("OpenAI Responses API failed: " + response.body());
        }

        // STEP 5 - Extract PCP JSON and metrics
        System.out.println("STEP 5: Parsing response...");
        JsonNode responseJson = mapper.readTree(response.body());

        // Extract token usage
        JsonNode usage = responseJson.path("usage");
        if (!usage.isMissingNode()) {
            metrics.setInputTokenSize(usage.path("input_tokens").asInt(0));
            metrics.setOutputTokenSize(usage.path("output_tokens").asInt(0));
            metrics.setTotalTokens(usage.path("total_tokens").asInt(0));
            metrics.setProcessedTokenSize(usage.path("input_tokens").asInt(0));

            JsonNode inputDetails = usage.path("input_tokens_details");
            if (!inputDetails.isMissingNode()) {
                metrics.setCacheWriteTokens(inputDetails.path("cache_write_tokens").asInt(0));
                metrics.setCachedTokens(inputDetails.path("cached_tokens").asInt(0));
            }

            JsonNode outputDetails = usage.path("output_tokens_details");
            if (!outputDetails.isMissingNode()) {
                metrics.setReasoningTokens(outputDetails.path("reasoning_tokens").asInt(0));
            }

            metrics.calculateCost();
            System.out.println("Tokens - Input: " + metrics.getInputTokenSize()
                    + ", Output: " + metrics.getOutputTokenSize()
                    + ", Total: " + metrics.getTotalTokens()
                    + ", Reasoning: " + metrics.getReasoningTokens()
                    + ", Cost: $" + metrics.getCostPerTransaction());
        }

        JsonNode output = responseJson.path("output");

        for (JsonNode outputItem : output) {
            JsonNode contents = outputItem.path("content");
            for (JsonNode item : contents) {
                if ("output_text".equals(item.path("type").asText())) {
                    String jsonText = item.path("text").asText();
                    System.out.println("Extracted JSON text");
                    JsonNode data = mapper.readTree(jsonText);
                    return new ExtractionResult(data, metrics);
                }
            }
        }

        throw new RuntimeException("Could not find output_text in OpenAI response");
    }
}
