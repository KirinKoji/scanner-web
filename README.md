# QR Ticket Scanner Backend

A localhost QR ticket scanning system built with NestJS and MongoDB. Scan QR codes, store ticket data, and export to CSV or Excel formats.

## Features

- 🎫 QR Code ticket scanning API
- 💾 MongoDB storage for scanned tickets
- 📊 Export data to CSV or Excel formats
- 🔍 View all scanned tickets
- 🚀 RESTful API endpoints

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally on port 27017)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Make sure MongoDB is running locally:
```bash
# If using MongoDB locally, start it with:
mongod

# Or if using Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## Usage

### API Endpoints

#### Scan a Ticket
```http
POST /tickets/scan
Content-Type: application/json

{
  "qrCode": "QR_CODE_DATA",
  "ticketId": "TKT-12345",
  "eventName": "Summer Music Festival",
  "attendeeName": "John Doe",
  "email": "john@example.com",
  "notes": "VIP ticket"
}
```

#### Get All Tickets
```http
GET /tickets
```

#### Get Single Ticket
```http
GET /tickets/:id
```

#### Export to CSV
```http
GET /tickets/export/csv
```

#### Export to Excel
```http
GET /tickets/export/excel
```

## Project Structure

```
qr-ticket-backend/
├── src/
│   ├── tickets/
│   │   ├── dto/
│   │   │   └── create-ticket.dto.ts
│   │   ├── schemas/
│   │   │   └── ticket.schema.ts
│   │   ├── tickets.controller.ts
│   │   ├── tickets.service.ts
│   │   └── tickets.module.ts
│   ├── app.module.ts
│   └── main.ts
└── package.json
```

## Database

The application uses MongoDB with the following connection:
- **Database**: `qr-tickets`
- **Connection String**: `mongodb://localhost:27017/qr-tickets`

### Ticket Schema

- `qrCode` (required): The scanned QR code data
- `ticketId` (optional): Custom ticket identifier
- `eventName` (optional): Name of the event
- `attendeeName` (optional): Name of the attendee
- `email` (optional): Attendee email
- `scannedAt` (auto): Timestamp of when ticket was scanned
- `isValid` (default: true): Validation status
- `notes` (optional): Additional notes
- `createdAt` (auto): Creation timestamp
- `updatedAt` (auto): Last update timestamp

## Export Formats

### CSV Export
- Comma-separated values format
- Includes all ticket fields
- Compatible with Excel, Google Sheets, etc.

### Excel Export
- `.xlsx` format
- Formatted with headers and styling
- Ready for professional reporting

## Development

```bash
# Run in watch mode
npm run start:dev

# Run tests
npm run test

# Lint code
npm run lint
```

## Configuration

To change the MongoDB connection string, edit `src/app.module.ts`:

```typescript
MongooseModule.forRoot('mongodb://localhost:27017/qr-tickets')
```

To change the port, set the `PORT` environment variable or modify `src/main.ts`.

## License

MIT
