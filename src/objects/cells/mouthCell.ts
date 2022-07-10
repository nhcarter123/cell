import { Cell } from "./cell";
import { lengthDirX, lengthDirY, pointDir } from "../../helpers/math";
import { TSavedCell } from "../../context/saveData";
import { MASS, RADIUS } from "../../config";
import { EImageKey } from "../../scenes/load";

export class MouthCell extends Cell {
  private currentAttackCoolDown: number;
  private currentAttackFrames: number;
  private readonly attackCoolDown: number;
  private readonly impulseFrames: number;
  private readonly attackFrames: number;
  private target?: Cell;
  private hitEnemies: Cell[];
  private readonly damage: number;

  constructor({ offset, angleOffset }: Partial<TSavedCell>) {
    super({
      offset,
      angleOffset,
      mass: MASS,
      health: 8,
      imageKey: EImageKey.MouthCell,
      isBody: false,
      mustPlacePerpendicular: true,
    });

    this.currentAttackCoolDown = 0;
    this.currentAttackFrames = 0;

    this.attackCoolDown = 180;
    this.impulseFrames = 5;
    this.attackFrames = 16;
    this.damage = 3;
    this.hitEnemies = [];
  }

  update(attacking: boolean, matter?: Phaser.Physics.Matter.MatterPhysics) {
    super.update(attacking, matter);

    if (this.isConnected) {
      if (this.currentAttackCoolDown === 0) {
        if (this.obj && attacking) {
          const findResult = this.organism?.ocean?.findClosestCell(
            this.obj.position.x,
            this.obj.position.y,
            this.organism?.isPlayer
          );

          if (findResult && findResult.closestDist < RADIUS + 70) {
            this.currentAttackCoolDown =
              this.attackCoolDown + this.attackFrames;
            this.currentAttackFrames = this.attackFrames + this.impulseFrames;
            this.hitEnemies = [];
            this.target = findResult.closest;
          }
        }
      } else {
        this.currentAttackCoolDown -= 1;
      }

      if (
        this.obj &&
        this.currentAttackFrames > 0 &&
        this.target?.obj &&
        matter
      ) {
        this.currentAttackFrames -= 1;

        const dirToCell = pointDir(
          this.obj.position.x,
          this.obj.position.y,
          this.target.obj.position.x,
          this.target.obj.position.y
        );

        if (this.currentAttackFrames - this.attackFrames > 0) {
          matter.applyForce(this.obj, {
            x: lengthDirX(0.008, dirToCell),
            y: lengthDirY(0.008, dirToCell),
          });
        }

        // const dist = pointDist(
        //   this.obj.position.x,
        //   this.obj.position.y,
        //   this.target.obj.position.x,
        //   this.target.obj.position.y
        // );

        const hitCells = this.organism?.ocean?.findCellsWithinRadius(
          this.obj.position.x,
          this.obj.position.y,
          RADIUS * 2 + 5,
          this.organism?.isPlayer
        );

        hitCells &&
          hitCells.forEach((cell) => {
            if (!this.hitEnemies.includes(cell)) {
              cell.health -= this.damage;
              this.hitEnemies.push(cell);
            }
          });
      }
    }
  }
}
