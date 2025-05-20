-- @param {Int} $1:minutesAgo
SELECT DISTINCT ON ("mmsi") mmsi,cog,sog,latitude,longitude,"shipName","trueHeading"
        FROM public."AISData"
        WHERE CAST("timeUtc" AS TIMESTAMP) >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '$1 MINUTE'
        ORDER BY "mmsi", "timeUtc" DESC;