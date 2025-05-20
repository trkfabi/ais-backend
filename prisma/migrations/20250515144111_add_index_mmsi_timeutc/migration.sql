-- CreateIndex
CREATE INDEX "AISData_mmsi_timeUtc_idx" ON "AISData"("mmsi", "timeUtc" DESC);
