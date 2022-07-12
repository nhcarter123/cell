import { Cell } from "./cell";
import { lengthDirX, lengthDirY, pointDir } from "../../helpers/math";
import { TSavedCell } from "../../context/saveData";
import { MASS, RADIUS } from "../../config";
import { EImageKey } from "../../scenes/load";
import { Organism } from "../organism";
import { BodyType, Vector } from "matter";

export class MouthCell extends Cell {
  private currentAttackCoolDown: number;
  private currentAttackFrames: number;
  private readonly attackCoolDown: number;
  private readonly impulseFrames: number;
  private readonly attackFrames: number;
  private target?: Cell;
  // private hitEnemies: Cell[];
  private hitEnemy: boolean;
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
    this.damage = 2;
    // this.hitEnemies = [];
    this.hitEnemy = false;
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
            // this.hitEnemies = [];
            this.hitEnemy = false;
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
          matter.applyForce(this.obj.parent, {
            x: lengthDirX(0.011, dirToCell),
            y: lengthDirY(0.011, dirToCell),
          });
        }

        // const dist = pointDist(
        //   this.obj.position.x,
        //   this.obj.position.y,
        //   this.target.obj.position.x,
        //   this.target.obj.position.y
        // );

        // const hitCells = this.organism?.ocean?.findCellsWithinRadius(
        //   this.obj.position.x,
        //   this.obj.position.y,
        //   RADIUS * 2 + 5,
        //   this.organism?.isPlayer
        // );

        // hitCells &&
        //   hitCells.forEach((cell) => {
        //     if (!this.hitEnemies.includes(cell)) {
        //       cell.health -= this.damage;
        //       this.hitEnemies.push(cell);
        //     }
        //   });
      }
    }
  }

  createBody(
    matter: Phaser.Physics.Matter.MatterPhysics,
    org: Organism,
    startPosition: Vector,
    angle: number
  ): BodyType | undefined {
    return super.createBody(
      matter,
      org,
      org.centerOfMass,
      angle,
      ({ bodyA, bodyB }: Phaser.Types.Physics.Matter.MatterCollisionData) => {
        if (this.currentAttackFrames > 0) {
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

          if (
            enemyCell &&
            !(enemyCell instanceof MouthCell) &&
            !this.hitEnemy
            // !this.hitEnemies.includes(enemyCell)
          ) {
            // this.hitEnemies.push(enemyCell);
            this.hitEnemy = true;
            this.currentAttackCoolDown = this.attackCoolDown;
            enemyCell.health -= this.damage;
          }
        }
      }
    );
  }
}
