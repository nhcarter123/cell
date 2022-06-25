import { Cell } from "./cell";
import { EImageKey, MASS } from "../../scenes/gameScene";
import { TSavedCell } from "../../context/saveData";

export class BrainCell extends Cell {
  constructor({ offsetX, offsetY, angleOffset }: Partial<TSavedCell>) {
    super({
      offsetX,
      offsetY,
      angleOffset,
      color: 0x544b57,
      mass: MASS,
      health: 5,
      imageKey: EImageKey.BrainCell,
      isBody: true,
    });
  }
}
