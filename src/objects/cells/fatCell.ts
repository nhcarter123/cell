import { Cell } from "./cell";
import { EImageKey, MASS } from "../../scenes/gameScene";

export class FatCell extends Cell {
  constructor(offsetX: number, offsetY: number) {
    super({
      offsetX,
      offsetY,
      color: 0xe3dfc3,
      mass: MASS,
      health: 5,
      imageKey: EImageKey.FatCell,
    });
  }
}
