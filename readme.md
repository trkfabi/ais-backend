# Vessel Tracker Backend

Backend service for the **Vessel Tracker** React Native app.  
Ingests real-time AIS (Automatic Identification System) vessel data from [aisstream.io](https://aisstream.io) via WebSocket, stores it in PostgreSQL, and exposes an API to deliver fresh vessel information to the frontend.

---

## 📦 Tech Stack

- **Node.js** + **TypeScript**
- **Express**
- **WebSockets**
- **Prisma**
- **PostgreSQL**
- **Docker**

---

## 🚢 Core Features

### WebSocket Data Ingestion

- Connects to **aisstream.io** and listens for `PositionReport` messages only.
- Filters incoming data by a **geo-boundary box**.
- Keeps WebSocket connection alive when idle and auto-reconnects on disconnect.
- Manages multiple client connections, sending only relevant data per client.

### Database

- Stores vessel positions with timestamps in PostgreSQL.
- Ensures data freshness (max age: 2 minutes).
- Avoids duplicates by using MMSI as a unique vessel identifier.

### API

- Endpoint to return vessels within the given geo-boundary and time window.
- Filters to ensure:
  - Unique MMSIs
  - Data no older than 2 minutes

### Docker

- Deployable via a Docker image.
- Supports pulling directly from a GitHub branch.

---

## 🛠 Setup

### Requirements

- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

## ⚙️ Environment Variables

Create a `.env` file in the project root with:
```
DATABASE_URL=postgresql://user:pass@db:5432/db_name
AIS_WS_URL=wss://stream.aisstream.io/v0/stream
AIS_WS_APIKEY=<YOUR_API>
PORT=3000
NODE_ENV=production
POSTGRES_USER=user
POSTGRES_PASSWORD=passw
POSTGRES_DB=db_name
```

### Installation

```bash
git clone <repo-url>
cd vessel-tracker-backend
npm install

```
