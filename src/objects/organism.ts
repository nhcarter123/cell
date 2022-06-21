import { BrainCell } from "./cells/brainCell";
import { Cell } from "./cells/cell";
import {
  angleDiff,
  pointDir,
  pointDirX,
  pointDirY,
  pointDist,
  toRad,
} from "../helpers/math";
import { compact } from "lodash";
import { DAMPING, STIFFNESS } from "../scenes/gameScene";
import { Vector } from "matter";
import { uniq } from "lodash";

export class Organism {
  public isPlayer: boolean;
  public brain?: BrainCell;
  public cells: Cell[];
  public avgPosition: MatterJS.Vector;
  private avgAngle: number;

  constructor(isPlayer: boolean, x: number, y: number, cells: Cell[]) {
    this.isPlayer = isPlayer;
    this.cells = cells;
    this.brain = cells.find((cell) => cell instanceof BrainCell);
    this.avgPosition = { x, y };
    this.avgAngle = 0;
  }

  create(
    add: Phaser.GameObjects.GameObjectFactory,
    matter: Phaser.Physics.Matter.MatterPhysics
  ) {
    this.cells.forEach((cell) => cell.create(this, add, matter));

    this.syncCells(matter);
  }

  syncLinks(matter: Phaser.Physics.Matter.MatterPhysics, cell: Cell) {
    if (cell.obj) {
      cell.links = compact(
        cell.links.map((l) => {
          if (l.cell.obj && l.cell.health > 0 && cell.health > 0) {
            return l;
          }

          matter.world.remove(l.link);
        })
      );

      if (cell.health > 0) {
        const linkableCells = cell.getLinkableCells();

        linkableCells.forEach((c) => {
          if (c.health > 0) {
            this.createLink(matter, cell, c);
          }
        });

        if (cell.links.length < 2) {
          const surroundingCells = cell.getSurroundingCells();
          const neighborCell = surroundingCells[0];

          if (neighborCell) {
            // todo change this so it always retrieves the opposite cell if available
            const moreLinkableCells = neighborCell.getSurroundingCells();

            for (const c of moreLinkableCells) {
              if (c.health > 0 && c !== cell) {
                this.createLink(matter, cell, c);
                break;
              }
            }
          }
        }
      }
    }
  }

  createLink(matter: Phaser.Physics.Matter.MatterPhysics, c1: Cell, c2: Cell) {
    if (c1.obj && c2.obj) {
      const dist = pointDist(
        c1.obj.position.x,
        c1.obj.position.y,
        c2.obj.position.x,
        c2.obj.position.y
      );

      const link = matter.add.constraint(c1.obj, c2.obj, dist, STIFFNESS, {
        damping: DAMPING,
      });

      c1.links.push({
        cell: c2,
        link,
      });

      c2.links.push({
        cell: c1,
        link,
      });
    }
  }

  calcCenterOfMass(targetDir: number) {
    let xTotal = 0;
    let yTotal = 0;
    let angTotal = 0;
    let totalCells = 0;

    for (const cell of this.cells) {
      if (cell.obj) {
        xTotal += cell.obj.position.x;
        yTotal += cell.obj.position.y;
        totalCells++;

        const cellAndAngle = cell.getFirstNeighborCell();

        if (cellAndAngle?.cell.obj) {
          const rotation = pointDir(
            cell.obj.position.x,
            cell.obj.position.y,
            cellAndAngle.cell.obj.position.x,
            cellAndAngle.cell.obj.position.y
          );

          if (cell.image) {
            cell.image.rotation = toRad(rotation - cellAndAngle.angle + 90);
          }

          // console.log(angleDiff(rotation - cellAndAngle.angle, targetDir));
          angTotal += angleDiff(rotation - cellAndAngle.angle, targetDir);
        }
      }
    }

    this.avgPosition = {
      x: xTotal / totalCells,
      y: yTotal / totalCells,
    };
    this.avgAngle = angTotal / totalCells;
    // console.log(org.avgAngle);
  }

  moveTowards(targetDir: number, matter: Phaser.Physics.Matter.MatterPhysics) {
    // if (this.brain) {
    //   const movementCells = [this.brain, ...this.brain.getSurroundingCells()];

    for (const cell of this.cells) {
      if (cell.obj) {
        const angleToCenter = pointDir(
          cell.obj.position.x,
          cell.obj.position.y,
          this.avgPosition.x,
          this.avgPosition.y
        );

        // const diff = angleDiff(
        //   angleToMouse,
        //   (cell.obj.angle * 180) / Math.PI
        // );
        // console.log(diff);

        matter.applyForce(cell.obj, {
          x: pointDirX(
            0.000002 * Math.min(Math.abs(this.avgAngle), 60),
            angleToCenter - 90 * -Math.sign(this.avgAngle)
          ),
          y: pointDirY(
            0.000002 * Math.min(Math.abs(this.avgAngle), 60),
            angleToCenter - 90 * -Math.sign(this.avgAngle)
          ),
        });

        matter.applyForce(cell.obj, {
          x: pointDirX(
            0.000001 * (60 - Math.min(Math.abs(this.avgAngle), 60)),
            targetDir
          ),
          y: pointDirY(
            0.000001 * (60 - Math.min(Math.abs(this.avgAngle), 60)),
            targetDir
          ),
        });
      }
    }
    // }
  }

  setConnected() {
    const cellsToCheck = compact([
      (this.brain?.health || 0) > 0 ? this.brain : undefined,
    ]);

    while (cellsToCheck.length) {
      const cell = cellsToCheck.pop();

      if (cell && !cell.beenScanned) {
        cell.connected = true;
        cell.beenScanned = true;

        cellsToCheck.push(...cell.getSurroundingCells());
      }
    }

    this.cells.forEach((cell) => (cell.beenScanned = false));
  }

  syncCells(matter: Phaser.Physics.Matter.MatterPhysics) {
    this.cells = compact(
      this.cells.map((cell) => {
        this.syncLinks(matter, cell);

        if (cell.health <= 0) {
          cell.destroy(matter);
        } else {
          // set all cells connected state to false in preparation for setConnected
          cell.connected = false;
          cell.beenScanned = false;

          return cell;
        }
      })
    );

    this.cells.forEach((cell) => cell.setChildrenCells());

    this.setConnected();
  }

  getAvailableSpots(): Vector[] {
    return uniq(
      this.cells.flatMap((cell) => cell.getSurroundingAvailableSpots())
    );
  }
}
