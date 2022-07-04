import { Cell } from "./cell";
import { EImageKey, MASS } from "../../scenes/gameScene";
import { TSavedCell } from "../../context/saveData";

export class FatCell extends Cell {
  constructor({ offset, angleOffset }: Partial<TSavedCell>) {
    super({
      offset,
      angleOffset,
      mass: MASS,
      health: 5,
      imageKey: EImageKey.FatCell,
    });
  }
}
