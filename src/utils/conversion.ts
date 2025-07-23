export const convertToDate = (date: string): Date => {
  const rawTimeUtc = date; //"2025-05-21 12:04:56.352365531 +0000 UTC";

  const cleanTimeUtc = rawTimeUtc.replace(" +0000 UTC", "Z");
  const timeUtc = new Date(cleanTimeUtc).toISOString();
  return new Date(timeUtc);
};
