import type {
  CanonicalRoom,
} from "../models/canonical-room";
import {
  RuntimeStore,
} from "./store-core";

export class RoomRuntimeStore extends RuntimeStore<CanonicalRoom | null> {
  constructor() {
    super(null);
  }

  setRoom(room: CanonicalRoom | null): void {
    this.setSnapshot(room);
  }
}

export const roomRuntimeStore =
  new RoomRuntimeStore();
