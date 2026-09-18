# Invoice Extraction API

Spring Boot backend for extracting invoice data using OpenAI API.

## Prerequisites

- Java 17+
- Maven 3.8+

## Setup

1. Install dependencies:
```bash
cd backend
mvn clean install
```

2. Run the application:
```bash
mvn spring-boot:run
```

The API will start on `http://localhost:8080`

## API Endpoints

### POST /api/extract
Upload a PDF file to extract invoice data.

**Request:**
- Content-Type: multipart/form-data
- Body: file (PDF)

**Response:**
```json
{
  "invoiceHeader": { ... },
  "lineItem": [ ... ],
  "poHeader": { ... },
  "supplierHeader": { ... }
}
```

### GET /api/health
Health check endpoint.

## Frontend Integration

The React frontend at `http://localhost:5173` will call this API automatically when you upload a PDF.
