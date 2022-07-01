import { Cell } from "./cell";
import { EImageKey, MASS, RAD_3_OVER_2, SPACING } from "../../scenes/gameScene";
import { TSavedCell } from "../../context/saveData";
import { Organism } from "../organism";
import DegToRad = Phaser.Math.DegToRad;
import { rotateVector } from "../../helpers/math";
import { BodyType } from "matter";

export class SpikeCell extends Cell {
  constructor({ offset, angleOffset }: Partial<TSavedCell>) {
    super({
      offset,
      angleOffset,
      color: 0xe3dfc3,
      mass: MASS,
      health: 5,
      imageKey: EImageKey.SpikeCell,
      isBody: false,
      mustPlacePerpendicular: true,
      isBone: true,
      imageOffsetEditor: { x: 0.5, y: 0.75 },
      imageOffset: { x: 0.5, y: 0.6 },
      occupiedSpots: [
        { x: 0, y: 0 },
        { x: 0.5, y: -RAD_3_OVER_2 },
      ],
    });
  }

  createBody(
    matter: Phaser.Physics.Matter.MatterPhysics,
    org: Organism
  ): BodyType {
    const offset = rotateVector(
      { x: 0, y: 0 },
      { x: this.imageOffset.x - 0.5, y: this.imageOffset.y - 0.4 },
      this.angleOffset + 180
    );

    return matter.bodies.trapezoid(
      org.avgPosition.x + (this.offset.x + offset.x) * SPACING,
      org.avgPosition.y + (this.offset.y + offset.y) * SPACING,
      24,
      84,
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
