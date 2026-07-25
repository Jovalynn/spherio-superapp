import type {
  TeamsRuntimeEvent,
} from "../models/canonical-events";
import {
  nexusTeamsEventBus,
} from "./event-bus";

export function synchronizeRuntimeEvent(
  event: TeamsRuntimeEvent,
): void {
  nexusTeamsEventBus.publish(event);
}
