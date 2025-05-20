-- CreateTable
CREATE TABLE "AISData" (
    "id" SERIAL NOT NULL,
    "cog" DOUBLE PRECISION,
    "communicationState" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "messageId" INTEGER,
    "navigationalStatus" INTEGER,
    "positionAccuracy" BOOLEAN NOT NULL,
    "raim" BOOLEAN NOT NULL,
    "rateOfTurn" INTEGER,
    "repeatIndicator" INTEGER,
    "sog" DOUBLE PRECISION,
    "spare" INTEGER,
    "specialManoeuvreIndicator" INTEGER,
    "timestamp" INTEGER,
    "trueHeading" INTEGER,
    "userId" BIGINT,
    "valid" BOOLEAN NOT NULL,
    "mmsi" BIGINT,
    "mmsiString" TEXT,
    "shipName" TEXT,
    "timeUtc" TEXT,
    "position" JSONB,

    CONSTRAINT "AISData_pkey" PRIMARY KEY ("id")
);
