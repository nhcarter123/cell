import { BrainCell } from "./cells/brainCell";
import { Cell, ISpotAndOffset } from "./cells/cell";
import {
  angleDiff,
  floatEquals,
  lengthDirX,
  lengthDirY,
  pointDir,
  pointDist,
  pointsEqual,
  rotateVector,
} from "../helpers/math";
import { compact } from "lodash";
import { DAMPING, RADIUS, SPACING, STIFFNESS } from "../scenes/gameScene";
import { Vector } from "matter";
import Ocean from "../scenes/ocean";
import RadToDeg = Phaser.Math.RadToDeg;
import { saveData } from "../context/saveData";

interface IBound {
  min: number;
  max: number;
}

interface IBounds {
  x: IBound;
  y: IBound;
}

export interface IAvailableSpot {
  pos: Vector;
  availableOffsets: number[];
}

export class Organism {
  public isPlayer: boolean;
  public brain?: BrainCell;
  public cells: Cell[];
  public avgPosition: MatterJS.Vector;
  public composite?: MatterJS.CompositeType;
  public ocean?: Ocean;
  private avgDiff: number;
  private vel: Vector;
  private angVel: number;
  public targetDir: number;

  constructor(isPlayer: boolean, x: number, y: number, cells: Cell[]) {
    this.isPlayer = isPlayer;
    this.cells = cells;
    this.brain = cells.find((cell) => cell instanceof BrainCell);
    this.avgPosition = { x, y };
    this.avgDiff = 0;
    this.vel = { x: 0, y: 0 };
    this.angVel = 0;
    this.targetDir = 0;
  }

  create(
    add: Phaser.GameObjects.GameObjectFactory,
    matter?: Phaser.Physics.Matter.MatterPhysics,
    ocean?: Ocean
  ) {
    this.ocean = ocean;

    this.cells.forEach((cell) => cell.create(this, add, matter));

    if (matter) {
      this.composite = matter.composite.create({
        bodies: compact(this.cells.map((cell) => cell.obj)),
      });
    }

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
      }
    }
  }

  createLink(matter: Phaser.Physics.Matter.MatterPhysics, c1: Cell, c2: Cell) {
    if (c1.obj && c2.obj) {
      const offset1 = rotateVector(
        { x: 0, y: 0 },
        { x: c1.imageOffset.x - 0.5, y: c1.imageOffset.y - 0.5 },
        c1.angleOffset
      );

      const offset2 = rotateVector(
        { x: 0, y: 0 },
        { x: c2.imageOffset.x - 0.5, y: c2.imageOffset.y - 0.5 },
        c2.angleOffset
      );

      const link = matter.add.constraint(c1.obj, c2.obj, SPACING, STIFFNESS, {
        damping: DAMPING,
        pointA: {
          x: -offset1.x * SPACING,
          y: -offset1.y * SPACING,
        },
        pointB: {
          x: -offset2.x * SPACING,
          y: -offset2.y * SPACING,
        },
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

  getMaxDiff(): number {
    const bounds = this.getBounds();

    return Math.max(
      Math.abs(bounds.x.min - bounds.x.max),
      Math.abs(bounds.y.min - bounds.y.max)
    );
  }

  getCenter(): Vector {
    const bounds = this.getBounds();

    return {
      x: (bounds.x.min + bounds.x.max) / 2,
      y: (bounds.y.min + bounds.y.max) / 2,
    };
  }

  getBounds(): IBounds {
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;

    this.cells.forEach((cell) => {
      if (cell.offsetX < minX) {
        minX = cell.offsetX;
      }
      if (cell.offsetX > maxX) {
        maxX = cell.offsetX;
      }
      if (cell.offsetY < minY) {
        minY = cell.offsetY;
      }
      if (cell.offsetY > maxY) {
        maxY = cell.offsetY;
      }
    });

    return {
      x: {
        min: minX,
        max: maxX,
      },
      y: {
        min: minY,
        max: maxY,
      },
    };
  }

  calcCenterOfMass() {
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

          const diff = angleDiff(
            rotation - cellAndAngle.angle,
            RadToDeg(cell.obj.angle) - cell.angleOffset
          );

          // cell.obj.torque = 0.005 * diff - cell.obj.angularVelocity;
          cell.obj.torque = 0.005 * diff;

          angTotal += angleDiff(
            rotation - cellAndAngle.angle + saveData.direction - 90,
            this.targetDir
          );
        }
      }
    }

    this.avgPosition = {
      x: xTotal / totalCells,
      y: yTotal / totalCells,
    };
    this.avgDiff = angTotal / totalCells;
  }
  //
  // moveTowards() {
  //   const turnFactor = 0.0002 * -Math.min(Math.abs(this.avgDiff), 60);
  //   const moveFactor = 0.0002 * (180 - Math.min(Math.abs(this.avgDiff), 180));
  //
  //   const x = lengthDirX(moveFactor, this.targetDir);
  //   const y = lengthDirY(moveFactor, this.targetDir);
  //
  //   this.angVel += turnFactor * Math.sign(this.avgDiff);
  //   this.vel = { x: this.vel.x + x, y: this.vel.y + y };
  // }

  // simulateMovement(matter: Phaser.Physics.Matter.MatterPhysics) {
  //   if (this.composite) {
  //     // friction
  //     const angFriction = 0.96;
  //     const moveFriction = 0.985;
  //     this.angVel *= angFriction;
  //     this.vel = { x: this.vel.x * moveFriction, y: this.vel.y * moveFriction };
  //
  //     matter.composite.translate(this.composite, this.vel);
  //     matter.composite.rotate(this.composite, DegToRad(this.angVel), {
  //       x: this.avgPosition.x,
  //       y: this.avgPosition.y,
  //     });
  //   }
  // }

  moveTowards(matter: Phaser.Physics.Matter.MatterPhysics) {
    // if (this.brain) {
    //   const movementCells = [this.brain, ...this.brain.getSurroundingCells()];

    // if (this.isPlayer) {
    //   this.currentAngle -= angleDiff(this.currentAngle, targetDir) / 100;
    // }
    // if (this.brain?.obj) {
    //   this.avgPosition = {
    //     x: this.brain.obj.position.x,
    //     y: this.brain.obj.position.y,
    //   };
    // }

    for (const cell of this.cells) {
      if (cell.obj) {
        const angleFromCenterToCell = pointDir(
          this.avgPosition.x,
          this.avgPosition.y,
          cell.obj.position.x,
          cell.obj.position.y
        );

        // replace with vector rotation
        const dist = pointDist(0, 0, cell.offsetX, cell.offsetY);
        const dir = pointDir(0, 0, cell.offsetX, cell.offsetY);

        const targetPosX =
          cell.obj.position.x +
          lengthDirX(
            dist * SPACING,
            dir + this.targetDir - saveData.direction + 90
          );
        const targetPosY =
          cell.obj.position.y +
          lengthDirY(
            dist * SPACING,
            dir + this.targetDir - saveData.direction + 90
          );

        const angleFromCenterToTarget = pointDir(
          this.avgPosition.x,
          this.avgPosition.y,
          targetPosX,
          targetPosY
        );

        const diff = angleDiff(angleFromCenterToCell, angleFromCenterToTarget);
        const distToTarget = pointDist(
          cell.obj.position.x,
          cell.obj.position.y,
          targetPosX,
          targetPosY
        );

        const turnFactor = 0.0000004 * Math.max(distToTarget, 10);
        const moveFactor =
          0.0000005 * (120 - Math.min(Math.abs(this.avgDiff), 120));
        // const turnFactor = 0.0001;

        matter.applyForce(cell.obj, {
          x:
            lengthDirX(
              turnFactor,
              angleFromCenterToCell - 90 * Math.sign(diff)
            ) + lengthDirX(moveFactor, this.targetDir),
          y:
            lengthDirY(
              turnFactor,
              angleFromCenterToCell - 90 * Math.sign(diff)
            ) + lengthDirY(moveFactor, this.targetDir),
        });

        // matter.applyForce(cell.obj, {
        //   x: (targetPosX - cell.obj.position.x) / 2000000,
        //   y: (targetPosY - cell.obj.position.y) / 2000000,
        // });

        // if (this.isPlayer) {
        //   // console.log(this.targetDir);
        //   console.log(moveFactor);
        // }
        // matter.applyForce(cell.obj, {
        //   x: lengthDirX(moveFactor, this.targetDir),
        //   y: lengthDirY(moveFactor, this.targetDir),
        // });
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

  syncCells(matter?: Phaser.Physics.Matter.MatterPhysics) {
    this.cells = compact(
      this.cells.map((cell) => {
        matter && this.syncLinks(matter, cell);

        if (cell.health <= 0) {
          matter && cell.destroy(matter);
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

  overlapsWith(
    occupiedSpots: Vector[],
    spot: ISpotAndOffset,
    decs = 4
  ): boolean {
    // console.log(occupiedSpots);
    // console.log(spot.offset);

    const transformedOccupiedSpots = occupiedSpots.map((occupiedSpot) =>
      rotateVector({ x: 0, y: 0 }, occupiedSpot, spot.offset + 90 + 60)
    );
    // console.log(transformedOccupiedSpots);

    return this.cells.some((cell) => {
      const transformedCellOccupiedSpots = cell.occupiedSpots.map(
        (occupiedSpot) =>
          rotateVector({ x: 0, y: 0 }, occupiedSpot, cell.angleOffset + 90 + 60)
      );
      // console.log(
      //   `{spot.offsetX: ${spot.pos.x} {spot.offsetY: ${spot.pos.y} ang: ${spot.offset}`
      // );
      // console.log(
      //   `{cell.offsetX: ${cell.offsetX} {cell.offsetY: ${cell.offsetY}`
      // );

      return transformedOccupiedSpots.some((occupiedSpot) =>
        transformedCellOccupiedSpots.some((occSpot) => {
          // console.log({
          //   x: cell.offsetX + occSpot.x,
          //   y: cell.offsetY + occSpot.y,
          // });
          //
          // console.log({
          //   x: spot.pos.x + occupiedSpot.x,
          //   y: spot.pos.y + occupiedSpot.y,
          // });
          // console.log(
          //   (cell.offsetX + occSpot.x).toFixed(decs) ===
          //     (spot.pos.x + occupiedSpot.x).toFixed(decs) &&
          //     (cell.offsetY + occSpot.y).toFixed(decs) ===
          //       (spot.pos.y + occupiedSpot.y).toFixed(decs)
          // );
          // console.log("===");
          return (
            floatEquals(
              cell.offsetX + occSpot.x,
              spot.pos.x + occupiedSpot.x
            ) &&
            floatEquals(cell.offsetY + occSpot.y, spot.pos.y + occupiedSpot.y)
          );
        })
      );
    });
  }

  getAvailableSpots(shapes: Vector[], decs = 4): IAvailableSpot[] {
    const storedSpots: IAvailableSpot[] = [];

    this.cells
      .flatMap((cell) => cell.getSurroundingAvailableSpots())
      .forEach((spot) => {
        const overlaps = this.overlapsWith(shapes, spot);

        if (!overlaps) {
          const duplicateSpot = storedSpots.find((storedSpot) =>
            pointsEqual(storedSpot.pos, spot.pos)
          );

          if (duplicateSpot) {
            duplicateSpot.availableOffsets.push(spot.offset);
          } else {
            storedSpots.push({
              pos: spot.pos,
              availableOffsets: [spot.offset],
            });
          }
        }
      });

    return storedSpots;
  }
}
