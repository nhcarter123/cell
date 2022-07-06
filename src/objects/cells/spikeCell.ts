import { Cell } from "./cell";
import { TSavedCell } from "../../context/saveData";
import { Organism } from "../organism";
import DegToRad = Phaser.Math.DegToRad;
import { rotateVector } from "../../helpers/math";
import { BodyType } from "matter";
import { MASS, PHYSICS_DEFAULTS, RAD_3_OVER_2, SPACING } from "../../config";
import { EImageKey } from "../../scenes/load";
import MatterCollisionData = Phaser.Types.Physics.Matter.MatterCollisionData;

export class SpikeCell extends Cell {
  private currentAttackCooldown: number;
  private attackCoolDown: number;
  private damage: number;

  constructor({ offset, angleOffset }: Partial<TSavedCell>) {
    super({
      offset,
      angleOffset,
      mass: MASS,
      health: 5,
      imageKey: EImageKey.SpikeCell,
      isBody: false,
      mustPlacePerpendicular: true,
      isBone: true,
      hasBackground: false,
      imageOffsetEditor: { x: 0.5, y: 0.75 },
      imageOffset: { x: 0.5, y: 0.6 },
      occupiedSpots: [
        { x: 0, y: 0 },
        { x: 0.5, y: -RAD_3_OVER_2 },
      ],
    });

    this.currentAttackCooldown = 0;
    this.attackCoolDown = 60;
    this.damage = 1;
  }

  update(attacking: boolean, matter?: Phaser.Physics.Matter.MatterPhysics) {
    super.update(attacking, matter);

    this.currentAttackCooldown -= 1;
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
      org.centerOfMass.x + (this.offset.x + offset.x) * SPACING,
      org.centerOfMass.y + (this.offset.y + offset.y) * SPACING,
      24,
      84,
      1,
      {
        mass: this.mass,
        angle: DegToRad(this.angleOffset),
        ...PHYSICS_DEFAULTS,
        onCollideCallback: ({ bodyB }: MatterCollisionData) => {
          if (
            this.currentAttackCooldown < 0 &&
            // @ts-ignore
            bodyB.cell &&
            // @ts-ignore
            bodyB.cell.organism?.isPlayer !== this.organism?.isPlayer
          ) {
            this.currentAttackCooldown = this.attackCoolDown;

            // @ts-ignore
            bodyB.cell.health -= this.damage;
          }
        },
      }
    );
  }
}
