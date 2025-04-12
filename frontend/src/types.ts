export interface DistrictFlow {
  from: string;
  to: string;
  amount: number;
  bikes: number;
}

export interface SimulationData {
  populationDensity: number[][];
  flowData: number[][];
  timeFaktors: {
    business: number;
    residential: number;
    mixed: number;
  };
  counts: { [key: string]: number };
  district_info?: {
    [key: number]: {
      type: string;
      bikes_available: number;
      district: string;
    };
  };
  districtFlows: DistrictFlow[];
  timeOfDay: string;
}
