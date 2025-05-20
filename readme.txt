backend: I'll use:
- node + express
- typescript
- postgres + postgis
- prisma


1 - prepare:

mkdir ais-backend && cd ais-backend
npm init -y
npm install express cors dotenv ws prisma @prisma/client pg
npm install -D typescript ts-node @types/node @types/express @types/ws
npx tsc --init

2- create pg db and add extension postgis

CREATE DATABASE ais_data;
\c ais_data
CREATE EXTENSION postgis;

3- init prisma: (PRISMA DOES NOT SUPPORT POSTGIS YET, create tables manually)
npx prisma init

. Set the DATABASE_URL in the .env file to point to your existing database. If your database has no tables yet, read https://pris.ly/d/getting-started
. Set the provider of the datasource block in schema.prisma to match your database: postgresql, mysql, sqlite, sqlserver, mongodb or cockroachdb.
. Run prisma db pull to turn your database schema into a Prisma schema.
. Run prisma generate to generate the Prisma Client. You can then start querying your database.

4- create account in ais stream using github account to get api keys:
https://aisstream.io/documentation

5- test wws with postman:
connection: wss://stream.aisstream.io/v0/stream
subscription message (within 3 secs): 
{
   "APIKey": "1ef8eeb7dbfadd988fa0ea3fb72459515921faae",
   "BoundingBoxes": [[[25.835302, -80.207729], [25.602700, -79.879297]], [[33.772292, -118.356139], [33.673490, -118.095731]] ],
   "FilterMessageTypes": ["PositionReport"]
}

we receive every 10 secs: 
{"Message":{"PositionReport":{"Cog":333.7,"CommunicationState":86138,"Latitude":33.731168333333336,"Longitude":-118.261105,"MessageID":3,"NavigationalStatus":5,"PositionAccuracy":true,"Raim":false,"RateOfTurn":0,"RepeatIndicator":0,"Sog":0,"Spare":0,"SpecialManoeuvreIndicator":0,"Timestamp":37,"TrueHeading":338,"UserID":368171260,"Valid":true}},"MessageType":"PositionReport","MetaData":{"MMSI":368171260,"MMSI_String":368171260,"ShipName":"MADELINE B HAMILTON ","latitude":33.731168333333336,"longitude":-118.261105,"time_utc":"2025-05-15 09:27:38.342017448 +0000 UTC"}}




