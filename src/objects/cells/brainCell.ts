import { Cell } from "./cell";
import { TSavedCell } from "../../context/saveData";
import { MASS } from "../../config";
import { EImageKey } from "../../scenes/load";

export class BrainCell extends Cell {
  constructor({ offset, angleOffset }: Partial<TSavedCell>) {
    super({
      offset,
      angleOffset,
      mass: MASS,
      health: 5,
      imageKey: EImageKey.BrainCell,
    });
  }
}
