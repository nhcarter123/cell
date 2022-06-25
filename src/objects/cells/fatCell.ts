import { Cell } from "./cell";
import { EImageKey, MASS } from "../../scenes/gameScene";
import { TSavedCell } from "../../context/saveData";

export class FatCell extends Cell {
  constructor({ offsetX, offsetY, angleOffset }: Partial<TSavedCell>) {
    super({
      offsetX,
      offsetY,
      angleOffset,
      color: 0xe3dfc3,
      mass: MASS,
      health: 5,
      imageKey: EImageKey.FatCell,
      isBody: true,
    });
  }
}
