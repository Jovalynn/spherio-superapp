export type WhiteboardElement = {
  id: string;
  type:
    | "pen"
    | "line"
    | "shape"
    | "text"
    | "image"
    | "note";
  x: number;
  y: number;
  width: number;
  height: number;
  data: Record<string, unknown>;
  createdBy: string | null;
  updatedAt: string;
};

export type WhiteboardSnapshot = {
  meetingId: string;
  revision: number;
  elements: WhiteboardElement[];
  updatedAt: string;
};
