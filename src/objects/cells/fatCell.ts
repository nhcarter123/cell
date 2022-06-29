import { Cell } from "./cell";
import { EImageKey, MASS } from "../../scenes/gameScene";
import { TSavedCell } from "../../context/saveData";

export class FatCell extends Cell {
  constructor({ offset, angleOffset }: Partial<TSavedCell>) {
    super({
      offset,
      angleOffset,
      color: 0xe3dfc3,
      mass: MASS,
      health: 5,
      imageKey: EImageKey.FatCell,
      isBody: true,
    });
  }
}
