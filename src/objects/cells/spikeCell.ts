import { Cell } from "./cell";
import { TSavedCell } from "../../context/saveData";
import { Organism } from "../organism";
import DegToRad = Phaser.Math.DegToRad;
import { rotateVector } from "../../helpers/math";
import { BodyType, Vector } from "matter";
import { MASS, PHYSICS_DEFAULTS, RAD_3_OVER_2, SPACING } from "../../config";
import { EImageKey } from "../../scenes/load";

export class SpikeCell extends Cell {
  private currentAttackCooldown: number;
  private attackCoolDown: number;
  private damage: number;

  constructor({ offset, angleOffset }: Partial<TSavedCell>) {
    super({
      offset,
      angleOffset,
      mass: MASS,
      health: 12,
      imageKey: EImageKey.SpikeCell,
      isBody: false,
      isBone: true,
      mustPlacePerpendicular: true,
      speed: 0.8,
      imageOffsetEditor: { x: 0.5, y: 0.75 },
      imageOffset: { x: 0.5, y: 0.7 },
      occupiedSpots: [
        { x: 0, y: 0 },
        { x: 0.5, y: -RAD_3_OVER_2 },
      ],
    });

    this.currentAttackCooldown = 0;
    this.attackCoolDown = 120;
    this.damage = 4;
  }

  update(attacking: boolean, matter?: Phaser.Physics.Matter.MatterPhysics) {
    super.update(attacking, matter);

    this.currentAttackCooldown -= 1;
  }

  createBody(
    matter: Phaser.Physics.Matter.MatterPhysics,
    org: Organism,
    startPosition: Vector,
    angle: number
  ): BodyType {
    const offset = rotateVector(
      { x: 0, y: 0 },
      { x: this.offset.x, y: this.offset.y },
      angle
    );

    const imageOffset = rotateVector(
      { x: 0, y: 0 },
      { x: this.imageOffset.x - 0.5, y: this.imageOffset.y - 0.5 },
      this.angleOffset + angle + 180
    );

    return matter.bodies.trapezoid(
      startPosition.x + (offset.x + imageOffset.x) * SPACING,
      startPosition.y + (offset.y + imageOffset.y) * SPACING,
      24,
      84,
      1,
      {
        mass: this.mass,
        angle: DegToRad(this.angleOffset + angle),
        ...PHYSICS_DEFAULTS,
        onCollideActiveCallback: ({
          bodyA,
          bodyB,
        }: Phaser.Types.Physics.Matter.MatterCollisionData) => {
          if (this.currentAttackCooldown < 0) {
            const enemyCell: Cell | undefined =
              // @ts-ignore
              bodyB.cell?.organism?.isPlayer !== this.organism?.isPlayer
                ? // @ts-ignore
                  bodyB.cell
                : // @ts-ignore
                bodyA.cell?.organism?.isPlayer !== this.organism?.isPlayer
                ? // @ts-ignore
                  bodyA.cell
                : undefined;

            if (enemyCell) {
              this.currentAttackCooldown = this.attackCoolDown;
              enemyCell.health -= this.damage;
            }
          }
        },
      }
    );
  }
}
