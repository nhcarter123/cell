import { Cell } from "./cell";
import { EImageKey } from "../../scenes/gameScene";
import { TSavedCell } from "../../context/saveData";
import { Organism } from "../organism";

export class CiliaCell extends Cell {
  constructor({ offset, angleOffset }: Partial<TSavedCell>) {
    super({
      offset,
      angleOffset,
      imageKey: EImageKey.CiliaCell,
      isBody: false,
      hasBackground: false,
      mustPlacePerpendicular: true,
      imageOffsetEditor: { x: 0.5, y: 0.15 },
      imageOffset: { x: 0.5, y: 1.25 },
      depth: 11,
    });
  }

  createBody(
    matter: Phaser.Physics.Matter.MatterPhysics,
    org: Organism
  ): MatterJS.BodyType | undefined {
    return undefined;
  }
}
