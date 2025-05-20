import * as $runtime from "../runtime/library"

/**
 */
export const getVesselsByTime: () => $runtime.TypedSql<getVesselsByTime.Parameters, getVesselsByTime.Result>

export namespace getVesselsByTime {
  export type Parameters = []
  export type Result = {
    mmsi: number | null
    cog: number | null
    sog: number | null
    latitude: number | null
    longitude: number | null
    shipName: string | null
    trueHeading: number | null
  }
}
