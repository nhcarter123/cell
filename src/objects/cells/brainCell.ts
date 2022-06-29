import { Cell } from "./cell";
import { EImageKey, MASS } from "../../scenes/gameScene";
import { TSavedCell } from "../../context/saveData";

export class BrainCell extends Cell {
  constructor({ offset, angleOffset }: Partial<TSavedCell>) {
    super({
      offset,
      angleOffset,
      color: 0x544b57,
      mass: MASS,
      health: 5,
      imageKey: EImageKey.BrainCell,
      isBody: true,
    });
  }
}
