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
}
