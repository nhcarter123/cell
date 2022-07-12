import { Cell } from "./cell";
import { EImageKey } from "../../scenes/load";
import { TSavedCell } from "../../context/saveData";
import { Organism } from "../organism";
import { Vector } from "matter";

export class CiliaCell extends Cell {
  constructor({ offset, angleOffset }: Partial<TSavedCell>) {
    super({
      offset,
      angleOffset,
      imageKey: EImageKey.CiliaCell,
      isBody: false,
      usesTint: true,
      mustPlacePerpendicular: true,
      imageOffsetEditor: { x: 0.5, y: 0.15 },
      imageOffset: { x: 0.5, y: 1.25 },
      depth: 11,
      speed: 3,
    });
  }

  createBody(
    matter: Phaser.Physics.Matter.MatterPhysics,
    org: Organism,
    startPosition: Vector,
    angle: number
  ): MatterJS.BodyType | undefined {
    return undefined;
  }
}
