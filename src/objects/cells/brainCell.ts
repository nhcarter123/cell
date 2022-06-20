import { Cell } from "./cell";
import { EImageKey, MASS } from "../../scenes/gameScene";

export class BrainCell extends Cell {
  constructor(offsetX: number, offsetY: number) {
    super({
      offsetX,
      offsetY,
      color: 0x544b57,
      mass: MASS,
      health: 5,
      imageKey: EImageKey.BrainCell,
    });
  }
}
