import { Cell } from "./cell";
import { EImageKey, MASS, RADIUS, SPACING } from "../../scenes/gameScene";
import { TSavedCell } from "../../context/saveData";
import { Organism } from "../organism";
import DegToRad = Phaser.Math.DegToRad;
import { rotateVector } from "../../helpers/math";

export class SpikeCell extends Cell {
  constructor({ offsetX, offsetY, angleOffset }: Partial<TSavedCell>) {
    super({
      offsetX,
      offsetY,
      angleOffset,
      color: 0xe3dfc3,
      mass: MASS,
      health: 5,
      imageKey: EImageKey.SpikeCell,
      isBody: false,
      imageOffset: { x: 0.5, y: 0.75 },
    });
  }

  createBody(matter: Phaser.Physics.Matter.MatterPhysics, org: Organism) {
    const offset = rotateVector(
      { x: 0, y: 0 },
      { x: this.imageOffset.x - 0.5, y: this.imageOffset.y - 0.5 },
      180 - this.angleOffset
    );
    console.log({ x: this.imageOffset.x - 0.5, y: this.imageOffset.y - 0.5 });
    console.log(this.angleOffset);
    console.log(offset);

    this.obj = matter.add.trapezoid(
      org.avgPosition.x + (this.offsetX + offset.x) * SPACING,
      org.avgPosition.y + (this.offsetY + offset.y) * SPACING,
      24,
      96,
      1,
      {
        restitution: 0,
        mass: this.mass,
        angle: DegToRad(this.angleOffset),
        // isStatic: true,
      }
    );
  }
}
