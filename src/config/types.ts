export interface Message {
  APIKey: string;
  BoundingBoxes: [number, number][][];
  FilterMessageTypes: string[];
}
