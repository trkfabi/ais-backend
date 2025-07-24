BACKEND: 
- node + express + typescript 
- postgres + postgis
- prisma (for non GIS tables)

1- Preparation:

mkdir ais-backend && cd ais-backend
npm init -y
npm install express cors dotenv ws prisma @prisma/client pg
npm install -D typescript ts-node @types/node @types/express @types/ws @types/pg
npx tsc --init

2- Setup prisma:

npx prisma init

3- Setup backend

Edit package.json and add a script:
"start:dev" : "nodemon --exec ts-node -T src/app.ts"

Edit .env:
add PORT=3000 and edit DATABASE_URL with db user/pwd and name

Create folder structure:
/src 
    /config
        -> db.ts
        -> types.ts
    /controllers
    /middlewares
    /models
    /routes
    /services
    app.ts

Crear types.ts:

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  results: T | null;
}

Crear db.ts:

import pg from "pg";

const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  allowExitOnIdle: true,
});


Edit app.ts:

import express, { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import { ApiResponse } from "./config/types";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Heatlh check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: "Server is running",
    results: null,
  };
  res.status(200).json(response);
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

4 - Test :
npm run "start:dev"
open browser and go to http://localhost:3000/api/health

5 - Crear DB e instalar Postgis en PgAdmin
Crear base
Abrir Query tool y ejecutar: Create Extension postgis

6 - Analizar el WSS: wss://stream.aisstream.io/v0/stream
Ver el mensaje JSON que devuelve y crear una tabla para almacenarlo

CREATE TABLE position_reports (
    id SERIAL PRIMARY KEY,
    cog DOUBLE PRECISION, -- Course over ground
    communication_state INTEGER,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    position_accuracy BOOLEAN,
    navigational_status INTEGER,
    raim BOOLEAN, -- Receiver autonomous integrity monitoring
    rate_of_turn INTEGER,
    sog DOUBLE PRECISION, -- Speed over ground
    special_manoeuvre_indicator INTEGER,
    timestamp INTEGER,
    true_heading INTEGER,
    user_id INTEGER, -- MMSI (Maritime Mobile Service Identity)
    valid BOOLEAN,
    mmsi INTEGER, -- Maritime Mobile Service Identity from metadata
    ship_name VARCHAR(255), -- Ship name from metadata
    time_utc TIMESTAMP, -- UTC timestamp from metadata
    geom geometry(Point, 4326) -- Geographical point
);

CREATE INDEX idx_position_reports_mmsi_time_utc
ON public.position_reports (mmsi, time_utc DESC);

CREATE INDEX idx_position_reports_geom ON position_reports USING GIST (geom);


7 - Crear un servicio que se conecte al WSS y reciba los mensajes
 en types.ts agregar: 

 export interface AisMessageRequest {
  APIKey: string;
  BoundingBoxes: [number, number][][];
  FilterMessageTypes: string[];
}

