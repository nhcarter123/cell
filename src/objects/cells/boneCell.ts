import { Cell } from "./cell";
import { TSavedCell } from "../../context/saveData";
import { MASS } from "../../config";
import { EImageKey } from "../../scenes/load";

export class BoneCell extends Cell {
  constructor({ offset, angleOffset }: Partial<TSavedCell>) {
    super({
      offset,
      angleOffset,
      mass: MASS,
      health: 8,
      imageKey: EImageKey.BoneCell,
      isBody: true,
      isBone: true,
      speed: 0.5,
    });
  }
}
