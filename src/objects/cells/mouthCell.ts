import { Cell } from "./cell";
import { findCellsWithinRadius, findClosestCell } from "../../scenes/ocean";
import { pointDir, pointDirX, pointDirY } from "../../helpers/math";
import { EImageKey, MASS, RADIUS } from "../../scenes/gameScene";

export class MouthCell extends Cell {
  private currentAttackCoolDown: number;
  private currentAttackFrames: number;
  private readonly attackCoolDown: number;
  private readonly impulseFrames: number;
  private readonly attackFrames: number;
  private target?: Cell;
  private hitEnemies: Cell[];
  private readonly damage: number;

  constructor(offsetX: number, offsetY: number) {
    super({
      offsetX,
      offsetY,
      color: 0xf2a041,
      mass: MASS,
      health: 8,
      imageKey: EImageKey.MouthCell,
    });

    this.currentAttackCoolDown = 0;
    this.currentAttackFrames = 0;

    this.attackCoolDown = 180;
    this.impulseFrames = 5;
    this.attackFrames = 16;
    this.damage = 1;
    this.hitEnemies = [];
  }

  update(matter: Phaser.Physics.Matter.MatterPhysics, attacking: boolean) {
    super.update(matter, attacking);

    if (this.currentAttackCoolDown === 0) {
      if (this.obj && attacking) {
        const findResult = findClosestCell(
          this.obj.position.x,
          this.obj.position.y
        );

        if (findResult.closestCellDist < RADIUS + 70) {
          this.currentAttackCoolDown = this.attackCoolDown + this.attackFrames;
          this.currentAttackFrames = this.attackFrames + this.impulseFrames;
          this.hitEnemies = [];
          this.target = findResult.closestCell;
        }
      }
    } else {
      this.currentAttackCoolDown -= 1;
    }

    if (this.obj && this.currentAttackFrames > 0 && this.target?.obj) {
      this.currentAttackFrames -= 1;

      const dirToCell = pointDir(
        this.obj.position.x,
        this.obj.position.y,
        this.target.obj.position.x,
        this.target.obj.position.y
      );

      if (this.currentAttackFrames - this.attackFrames > 0) {
        matter.applyForce(this.obj, {
          x: pointDirX(0.008, dirToCell),
          y: pointDirY(0.008, dirToCell),
        });
      }

      // const dist = pointDist(
      //   this.obj.position.x,
      //   this.obj.position.y,
      //   this.target.obj.position.x,
      //   this.target.obj.position.y
      // );

      const hitCells = findCellsWithinRadius(
        this.obj.position.x,
        this.obj.position.y,
        RADIUS * 2 + 5
      );

      hitCells.forEach((cell) => {
        if (!this.hitEnemies.includes(cell)) {
          cell.health -= this.damage;
          this.hitEnemies.push(cell);
        }
      });
    }
  }
}
