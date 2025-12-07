export interface Coordinate {
  lat: number;
  lng: number;
}

export interface ElevationPoint {
  distance: number; // meters from start
  elevation: number; // meters above sea level
  location: Coordinate;
}

export interface ProfileLine {
  id: string;
  start: Coordinate;
  end: Coordinate;
  color: string;
  name: string;
  data: ElevationPoint[];
  isAnalyzing?: boolean;
  analysisResult?: string;
}

export enum DrawingState {
  IDLE = 'IDLE',
  WAITING_FOR_SECOND_POINT = 'WAITING_FOR_SECOND_POINT',
}

export const LINE_COLORS = [
  '#EF476F', // Pink
  '#06D6A0', // Green
  '#118AB2', // Blue
  '#FFD166', // Yellow
];