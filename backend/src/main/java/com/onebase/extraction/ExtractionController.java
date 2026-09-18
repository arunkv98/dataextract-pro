package com.onebase.extraction;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ExtractionController {

    @Autowired
    private OpenAIService openAIService;

    @Autowired
    private CryptoService cryptoService;

    private final ObjectMapper mapper = new ObjectMapper();

    @PostMapping("/extract")
    public ResponseEntity<?> extractInvoice(@RequestParam("file") MultipartFile file) {
        try {
            System.out.println("========== REQUEST RECEIVED ==========");
            System.out.println("File name: " + file.getOriginalFilename());
            System.out.println("File size: " + file.getSize() + " bytes");

            Path tempFile = Files.createTempFile("upload-", ".pdf");
            file.transferTo(tempFile.toFile());

            PDDocument pdfDoc = Loader.loadPDF(tempFile.toFile());
            int totalPages = pdfDoc.getNumberOfPages();
            pdfDoc.close();
            System.out.println("Total pages: " + totalPages);

            if (totalPages == 1) {
                ExtractionResult result = openAIService.extractInvoice(tempFile.toFile());
                Files.delete(tempFile);

                ObjectNode response = mapper.createObjectNode();
                ArrayNode pages = mapper.createArrayNode();
                ObjectNode pageData = mapper.createObjectNode();
                pageData.put("pageNumber", 1);
                pageData.set("data", result.getData());
                pages.add(pageData);
                response.set("pages", pages);
                response.put("totalPages", 1);
                response.set("metrics", mapper.valueToTree(result.getMetrics()));

                return ResponseEntity.ok(response);
            } else {
                return extractMultiPage(tempFile.toFile(), totalPages);
            }
        } catch (Exception e) {
            System.out.println("========== ERROR ==========");
            System.out.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private ResponseEntity<?> extractMultiPage(File pdfFile, int totalPages) {
        try {
            PDDocument pdfDoc = Loader.loadPDF(pdfFile);
            ArrayNode pagesArray = mapper.createArrayNode();
            List<File> tempFiles = new ArrayList<>();
            ExtractionMetrics aggregatedMetrics = new ExtractionMetrics();
            aggregatedMetrics.setAiModel("gpt-5.6-luna");
            aggregatedMetrics.setAiCostingType("per-token");

            long totalInputSize = 0;
            int totalInputTokens = 0;
            int totalOutputTokens = 0;
            int totalTokens = 0;
            int totalCacheWrite = 0;
            int totalCached = 0;
            int totalReasoning = 0;

            for (int i = 0; i < totalPages; i++) {
                System.out.println("\n--- Extracting page " + (i + 1) + " of " + totalPages + " ---");

                PDDocument singlePageDoc = new PDDocument();
                singlePageDoc.addPage(pdfDoc.getPage(i));
                Path singlePagePath = Files.createTempFile("page-" + (i + 1) + "-", ".pdf");
                singlePageDoc.save(singlePagePath.toFile());
                singlePageDoc.close();
                tempFiles.add(singlePagePath.toFile());

                try {
                    ExtractionResult result = openAIService.extractInvoice(singlePagePath.toFile());
                    ObjectNode pageData = mapper.createObjectNode();
                    pageData.put("pageNumber", i + 1);
                    pageData.set("data", result.getData());
                    pagesArray.add(pageData);

                    ExtractionMetrics m = result.getMetrics();
                    totalInputSize += m.getInputPacketSize();
                    totalInputTokens += m.getInputTokenSize();
                    totalOutputTokens += m.getOutputTokenSize();
                    totalTokens += m.getTotalTokens();
                    totalCacheWrite += m.getCacheWriteTokens();
                    totalCached += m.getCachedTokens();
                    totalReasoning += m.getReasoningTokens();

                    System.out.println("Page " + (i + 1) + " extracted successfully");
                } catch (Exception e) {
                    System.out.println("Page " + (i + 1) + " extraction failed: " + e.getMessage());
                    ObjectNode pageData = mapper.createObjectNode();
                    pageData.put("pageNumber", i + 1);
                    pageData.put("error", e.getMessage());
                    pagesArray.add(pageData);
                }
            }

            pdfDoc.close();
            for (File f : tempFiles) {
                Files.deleteIfExists(f.toPath());
            }
            Files.deleteIfExists(pdfFile.toPath());

            aggregatedMetrics.setInputPacketSize(totalInputSize);
            aggregatedMetrics.setInputTokenSize(totalInputTokens);
            aggregatedMetrics.setOutputTokenSize(totalOutputTokens);
            aggregatedMetrics.setProcessedTokenSize(totalInputTokens);
            aggregatedMetrics.setTotalTokens(totalTokens);
            aggregatedMetrics.setCacheWriteTokens(totalCacheWrite);
            aggregatedMetrics.setCachedTokens(totalCached);
            aggregatedMetrics.setReasoningTokens(totalReasoning);
            aggregatedMetrics.calculateCost();

            ObjectNode response = mapper.createObjectNode();
            response.set("pages", pagesArray);
            response.put("totalPages", totalPages);
            response.set("metrics", mapper.valueToTree(aggregatedMetrics));

            System.out.println("\n========== ALL PAGES EXTRACTED ==========");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping(value = "/extract-secure", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> extractSecure(@RequestBody byte[] encryptedPayload) {
        try {
            System.out.println("========== SECURE REQUEST RECEIVED ==========");
            System.out.println("Encrypted payload size: " + encryptedPayload.length + " bytes");

            String decryptedJson = cryptoService.decryptAndDecompress(encryptedPayload);
            System.out.println("Decrypted JSON size: " + decryptedJson.length() + " bytes");

            JsonNode payloadNode = mapper.readTree(decryptedJson);

            if (payloadNode.has("filePath")) {
                String filePath = payloadNode.get("filePath").asText();
                int totalPages = payloadNode.get("totalPages").asInt();
                File pdfFile = new File(filePath);

                if (!pdfFile.exists()) {
                    byte[] errorResp = cryptoService.compressAndEncrypt(
                        mapper.writeValueAsString(Map.of("error", "PDF file not found"))
                    );
                    return ResponseEntity.ok(errorResp);
                }

                ObjectNode response;
                if (totalPages <= 1) {
                    ExtractionResult result = openAIService.extractInvoice(pdfFile);
                    ArrayNode pages = mapper.createArrayNode();
                    ObjectNode pageData = mapper.createObjectNode();
                    pageData.put("pageNumber", 1);
                    pageData.set("data", result.getData());
                    pages.add(pageData);
                    response = mapper.createObjectNode();
                    response.set("pages", pages);
                    response.put("totalPages", 1);
                    response.set("metrics", mapper.valueToTree(result.getMetrics()));
                } else {
                    response = extractMultiPageJson(pdfFile, totalPages);
                }

                String responseJson = mapper.writeValueAsString(response);
                byte[] encryptedResponse = cryptoService.compressAndEncrypt(responseJson);
                System.out.println("========== SECURE RESPONSE SENT ==========");
                return ResponseEntity.ok(encryptedResponse);

            } else {
                String base64Pdf = payloadNode.get("pdf").asText();
                byte[] pdfBytes = java.util.Base64.getDecoder().decode(base64Pdf);

                Path tempFile = Files.createTempFile("secure-upload-", ".pdf");
                Files.write(tempFile, pdfBytes);

                PDDocument pdfDoc = Loader.loadPDF(tempFile.toFile());
                int totalPages = pdfDoc.getNumberOfPages();
                pdfDoc.close();

                ObjectNode response;
                if (totalPages <= 1) {
                    ExtractionResult result = openAIService.extractInvoice(tempFile.toFile());
                    ArrayNode pages = mapper.createArrayNode();
                    ObjectNode pageData = mapper.createObjectNode();
                    pageData.put("pageNumber", 1);
                    pageData.set("data", result.getData());
                    pages.add(pageData);
                    response = mapper.createObjectNode();
                    response.set("pages", pages);
                    response.put("totalPages", 1);
                    response.set("metrics", mapper.valueToTree(result.getMetrics()));
                } else {
                    response = extractMultiPageJson(tempFile.toFile(), totalPages);
                }

                Files.deleteIfExists(tempFile);

                String responseJson = mapper.writeValueAsString(response);
                byte[] encryptedResponse = cryptoService.compressAndEncrypt(responseJson);
                System.out.println("========== SECURE RESPONSE SENT ==========");
                return ResponseEntity.ok(encryptedResponse);
            }

        } catch (Exception e) {
            System.out.println("========== SECURE ERROR ==========");
            System.out.println("Error: " + e.getMessage());
            e.printStackTrace();
            try {
                byte[] errorResp = cryptoService.compressAndEncrypt(
                    mapper.writeValueAsString(Map.of("error", e.getMessage()))
                );
                return ResponseEntity.ok(errorResp);
            } catch (Exception ex) {
                return ResponseEntity.internalServerError().build();
            }
        }
    }

    private ObjectNode extractMultiPageJson(File pdfFile, int totalPages) throws Exception {
        PDDocument pdfDoc = Loader.loadPDF(pdfFile);
        ArrayNode pagesArray = mapper.createArrayNode();
        List<File> tempFiles = new ArrayList<>();
        ExtractionMetrics aggregatedMetrics = new ExtractionMetrics();
        aggregatedMetrics.setAiModel("gpt-5.6-luna");
        aggregatedMetrics.setAiCostingType("per-token");

        long totalInputSize = 0;
        int totalInputTokens = 0;
        int totalOutputTokens = 0;
        int totalTokens = 0;
        int totalCacheWrite = 0;
        int totalCached = 0;
        int totalReasoning = 0;

        for (int i = 0; i < totalPages; i++) {
            System.out.println("\n--- Extracting page " + (i + 1) + " of " + totalPages + " ---");

            PDDocument singlePageDoc = new PDDocument();
            singlePageDoc.addPage(pdfDoc.getPage(i));
            Path singlePagePath = Files.createTempFile("page-" + (i + 1) + "-", ".pdf");
            singlePageDoc.save(singlePagePath.toFile());
            singlePageDoc.close();
            tempFiles.add(singlePagePath.toFile());

            try {
                ExtractionResult result = openAIService.extractInvoice(singlePagePath.toFile());
                ObjectNode pageData = mapper.createObjectNode();
                pageData.put("pageNumber", i + 1);
                pageData.set("data", result.getData());
                pagesArray.add(pageData);

                ExtractionMetrics m = result.getMetrics();
                totalInputSize += m.getInputPacketSize();
                totalInputTokens += m.getInputTokenSize();
                totalOutputTokens += m.getOutputTokenSize();
                totalTokens += m.getTotalTokens();
                totalCacheWrite += m.getCacheWriteTokens();
                totalCached += m.getCachedTokens();
                totalReasoning += m.getReasoningTokens();

                System.out.println("Page " + (i + 1) + " extracted successfully");
            } catch (Exception e) {
                System.out.println("Page " + (i + 1) + " extraction failed: " + e.getMessage());
                ObjectNode pageData = mapper.createObjectNode();
                pageData.put("pageNumber", i + 1);
                pageData.put("error", e.getMessage());
                pagesArray.add(pageData);
            }
        }

        pdfDoc.close();
        for (File f : tempFiles) {
            Files.deleteIfExists(f.toPath());
        }

        aggregatedMetrics.setInputPacketSize(totalInputSize);
        aggregatedMetrics.setInputTokenSize(totalInputTokens);
        aggregatedMetrics.setOutputTokenSize(totalOutputTokens);
        aggregatedMetrics.setProcessedTokenSize(totalInputTokens);
        aggregatedMetrics.setTotalTokens(totalTokens);
        aggregatedMetrics.setCacheWriteTokens(totalCacheWrite);
        aggregatedMetrics.setCachedTokens(totalCached);
        aggregatedMetrics.setReasoningTokens(totalReasoning);
        aggregatedMetrics.calculateCost();

        ObjectNode response = mapper.createObjectNode();
        response.set("pages", pagesArray);
        response.put("totalPages", totalPages);
        response.set("metrics", mapper.valueToTree(aggregatedMetrics));
        return response;
    }
}
