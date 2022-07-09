import { BrainCell } from "./cells/brainCell";
import { Cell, ISpotAndOffset } from "./cells/cell";
import {
  addVectors,
  angleDiff,
  floatEquals,
  getCenter,
  getMaxDiff,
  lengthDirX,
  lengthDirY,
  pointDir,
  pointDist,
  pointsEqual,
  rotateVector,
} from "../helpers/math";
import { compact } from "lodash";
import { Vector } from "matter";
import Ocean from "../scenes/ocean";
import RadToDeg = Phaser.Math.RadToDeg;
import { saveData } from "../context/saveData";
import {
  DAMPING,
  PHYSICS_DEFAULTS,
  RADIUS,
  SPACING,
  STIFFNESS,
} from "../config";
import OutlinePipelinePlugin from "phaser3-rex-plugins/plugins/outlinepipeline-plugin";
import { nanoid } from "nanoid";

interface IBound {
  min: number;
  max: number;
}

export interface IBounds {
  x: IBound;
  y: IBound;
}

export interface IAvailableSpot {
  pos: Vector;
  availableOffsets: number[];
}

const MAX_SHADER_CELLS = 100;

const SKIN_COLOR = Phaser.Display.Color.ValueToColor("#917342");
const SKIN_OUTLINE_COLOR = Phaser.Display.Color.ValueToColor("#645741").color;
const SKIN_THICKNESS = 4;
const SKIN_RADIUS = 34;
const SKIN_ALPHA = 0.4;

const padding = RADIUS + 10;

export class Organism {
  public id: string;
  public isPlayer: boolean;
  public brain?: BrainCell;
  public cells: Cell[];
  public centerOfMass: MatterJS.Vector;
  public ocean?: Ocean;
  // private vel: Vector;
  // private angVel: number;
  public targetDir: number;
  private skinShader?: Phaser.GameObjects.Shader;
  private skin?: Phaser.GameObjects.Image;
  private debug?: Phaser.GameObjects.Graphics;
  private skinResolution: number;

  constructor(isPlayer: boolean, x: number, y: number, cells: Cell[]) {
    this.isPlayer = isPlayer;
    this.cells = cells;
    this.brain = cells.find((cell) => cell instanceof BrainCell);
    this.centerOfMass = { x, y };
    this.skinResolution = 0;
    this.targetDir = 0;
    this.id = nanoid();
  }

  create(
    add: Phaser.GameObjects.GameObjectFactory,
    pipeline?: OutlinePipelinePlugin,
    matter?: Phaser.Physics.Matter.MatterPhysics,
    ocean?: Ocean
  ) {
    this.ocean = ocean;

    if (this.isPlayer) {
      this.debug = add.graphics();
      this.debug.depth = 100;
    }

    // this.skinShader.depth = matter ? 10 : -10;
    // this.skinShader.depth = -10;
    // console.log(this.skinShader.uniforms.resolution);
    // .setRenderToTexture("skinTexture");
    // this.skinShader.setUniform("resolution.value", [100, 100]);
    // this.skinShader.setUniform("resolution.value", { x: 100, y: 100 });
    // this.skinShader.setUniform("resolution.value", [{ x: 100, y: 100 }]);
    // this.skinShader.setUniform("resolution.value", [50, 50]);
    // this.skinShader.setUniform("resolution.value.x", 50);
    // this.skinShader.setUniform("resolution.value.y", 50);

    // this.skinTexture = add.image(0, 0, "skinTexture");
    this.cells.forEach((cell) => cell.create(this, add, matter));

    this.syncCells(matter);

    this.skinResolution = Math.min(getMaxDiff(this.getBounds(padding)), 500);

    this.skinShader = add
      .shader("skin", 0, 0, this.skinResolution, this.skinResolution)
      .setRenderToTexture(`skin-${this.id}`);
    this.skinShader.setUniform("color.value", [
      SKIN_COLOR.red / 255,
      SKIN_COLOR.green / 255,
      SKIN_COLOR.blue / 255,
    ]);
    this.skinShader.setUniform("alpha.value", SKIN_ALPHA);
    this.skin = add.image(0, 0, `skin-${this.id}`);
    this.skin.depth = matter ? 10 : -10;

    pipeline?.add(this.skin, {
      // @ts-ignore the typing is just broken on this
      thickness: SKIN_THICKNESS,
      outlineColor: SKIN_OUTLINE_COLOR,
    });
  }

  update(attacking: boolean, matter?: Phaser.Physics.Matter.MatterPhysics) {
    this.cells.forEach((cell) =>
      cell.update(this.isPlayer ? attacking : true, matter)
    );

    // const a = this.cells.sort((b, a) => (b.image?.x || 0) - (a.image?.x || 0));
    // console.log(a[0]);

    const bounds = this.getBounds(padding);
    const center = getCenter(bounds);
    const scale = getMaxDiff(bounds);
    const radius = SKIN_RADIUS / scale;
    // console.log(center);

    const cellOffsets = [];

    // console.log(center.x / maxDiff);

    for (let i = 0; i < MAX_SHADER_CELLS; i++) {
      const cell = this.cells[i];
      if (cell?.hasBackground && cell.image && cell.health === cell.maxHealth) {
        // if (matter && cell.obj) {
        //   cellOffsets.push(cell.obj.position.x / scale + 0.5);
        //   cellOffsets.push(cell.obj.position.y) / scale + 0.5;
        // } else if (cell.image) {
        cellOffsets.push((cell.image.x - center.x) / scale + 0.5);
        cellOffsets.push((-cell.image.y + center.y) / scale + 0.5);
        // }
      } else {
        cellOffsets.push(-1);
        cellOffsets.push(-1);
      }
    }

    if (this.skinShader && this.skin) {
      this.skinShader.setUniform("cells.value", cellOffsets);
      this.skinShader.setUniform("radius.value", radius);
      this.skin.x = center.x;
      this.skin.y = center.y;

      // console.log(this.skinShader.uniforms);
      this.skin.scale = scale / this.skinResolution;
    }

    // const cellOffsets = matter
    //   ? this.cells.map((cell) => ({
    //       x: cell.obj?.position.x,
    //       y: cell.obj?.position.y,
    //     }))
    //   : this.cells.map((cell) => ({
    //       x: cell.offset.x * SPACING,
    //       y: cell.offset.y * SPACING,
    //     }));
    //
    // if (this.bodyOutline) {
    //   // @ts-ignore
    //   const points: Vector[] = hull(cellOffsets, 250, [".x", ".y"]);
    //
    //   this.bodyOutline.clear();
    //   // this.bodyOutline.strokePath()
    //   this.bodyOutline.fillStyle(SKIN_COLOR);
    //   this.bodyOutline.strokePoints(points, true, true);
    //   this.bodyOutline.fill();
    // }

    // const cellOffsets = matter
    //   ? this.cells.map((cell) => ({
    //     x: cell.obj?.position.x,
    //     y: cell.obj?.position.y,
    //   }))
    //   : this.cells.map((cell) => ({
    //     x: cell.offset.x * SPACING,
    //     y: cell.offset.y * SPACING,
    //   }));

    // if (this.bodyOutline) {
    //   const points = this.cells.map((cell) => ({
    //     x: cell.offset.x * SPACING,
    //     y: cell.offset.y * SPACING,
    //   }));
    //
    //   this.bodyOutline.clear();
    //   // this.bodyOutline.strokePath()
    //   this.bodyOutline.fillStyle(SKIN_COLOR);
    //   this.bodyOutline.strokePoints(points, true, true);
    //   this.bodyOutline.fill();
    // }
  }

  createBones(matter: Phaser.Physics.Matter.MatterPhysics, cell: Cell) {
    if (cell.isBone && cell.obj?.parent === cell.obj) {
      const boneCells = this.aggregateBone(cell);

      if (boneCells.length > 1) {
        const parts = compact(
          boneCells.map((c) => {
            c.obj && matter.world.remove(c.obj);
            c.obj = c.createBody(
              matter,
              this,
              RadToDeg(this.brain?.obj?.angle || 0)
            );
            // @ts-ignore
            c.obj.cell = c;

            return c.obj;
          })
        );

        const compound = matter.body.create({ parts, ...PHYSICS_DEFAULTS });

        matter.world.add(compound);
      }
    }
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
            if (c.obj?.parent !== c.obj && cell.obj?.parent !== cell.obj) {
              //
            } else {
              this.createLink(matter, cell, c);
            }
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
        c1.angleOffset + 180
      );

      const offset2 = rotateVector(
        { x: 0, y: 0 },
        { x: c2.imageOffset.x - 0.5, y: c2.imageOffset.y - 0.5 },
        c2.angleOffset + 180
      );

      const link = matter.add.constraint(
        c1.obj.parent,
        c2.obj.parent,
        SPACING,
        STIFFNESS,
        {
          damping: DAMPING,
          pointA: {
            x:
              c1.obj.position.x -
              c1.obj.parent.position.x -
              offset1.x * SPACING,
            y:
              c1.obj.position.y -
              c1.obj.parent.position.y -
              offset1.y * SPACING,
          },
          pointB: {
            x:
              c2.obj.position.x -
              c2.obj.parent.position.x -
              offset2.x * SPACING,
            y:
              c2.obj.position.y -
              c2.obj.parent.position.y -
              offset2.y * SPACING,
          },
        }
      );

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

  getBounds(padding = 0): IBounds {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    this.cells.forEach((cell) => {
      if (cell.image) {
        if (cell.image.x < minX) {
          minX = cell.image.x;
        }
        if (cell.image.x > maxX) {
          maxX = cell.image.x;
        }
        if (cell.image.y < minY) {
          minY = cell.image.y;
        }
        if (cell.image.y > maxY) {
          maxY = cell.image.y;
        }
      }
    });

    return {
      x: {
        min: minX - padding,
        max: maxX + padding,
      },
      y: {
        min: minY - padding,
        max: maxY + padding,
      },
    };
  }

  calcCenterOfMass() {
    let xTotal = 0;
    let yTotal = 0;
    let totalMass = 0;
    let angTotal = 0;
    let totalCells = 0;

    for (const cell of this.cells) {
      if (cell.obj && cell.isConnected) {
        // console.log(cell.obj.position.x);
        xTotal += cell.obj.position.x * cell.obj.mass;
        yTotal += cell.obj.position.y * cell.obj.mass;
        totalMass += cell.obj.mass;
        totalCells += 1;

        const cellAndAngle = cell.getFirstNeighborCell();

        if (cellAndAngle?.cell.obj) {
          const rotation = pointDir(
            cell.obj.position.x,
            cell.obj.position.y,
            cellAndAngle.cell.obj.position.x,
            cellAndAngle.cell.obj.position.y
          );

          const phyAngle =
            RadToDeg(cell.obj.parent.angle) -
            cell.angleOffset +
            cell.physicsAngleOffset;

          const diff = angleDiff(phyAngle, rotation - cellAndAngle.angle);

          // if (this.isPlayer) {
          //   console.log(diff);
          // }

          // this.targetDir -
          // saveData.direction +
          // 90

          cell.obj.torque -= 0.001 * diff + cell.obj.angularVelocity / 3;

          // const diff = angleDiff(
          //   RadToDeg(cell.obj.angle) -
          //   cell.angleOffset +
          //   this.targetDir -
          //   saveData.direction +
          //   90,
          //   rotation - cellAndAngle.angle
          // );
          // if (cell.obj.parent !== cell.obj) {
          //   cell.obj.parent.torque += 0.00001 * diff; //- cell.obj.angularVelocity / 3;
          // }

          // angTotal += angleDiff(
          //   rotation - cellAndAngle.angle + saveData.direction - 90,
          //   this.targetDir
          // );
        }
      }
    }

    // if (this.isPlayer) {
    //   console.log(xTotal / totalMass);
    // }
    // console.log(totalMass);

    if (totalMass) {
      this.centerOfMass = {
        x: xTotal / totalMass,
        y: yTotal / totalMass,
      };
    }
    // this.avgDiff = angTotal / totalCells;
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
  //       x: this.centerOfMass.x,
  //       y: this.centerOfMass.y,
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
    //   this.centerOfMass = {
    //     x: this.brain.obj.position.x,
    //     y: this.brain.obj.position.y,
    //   };
    // }

    if (this.brain?.obj) {
      if (this.debug) {
        this.debug.clear();
      }

      const facingDir = RadToDeg(this.brain.obj.parent.angle);
      const diffToTarget = angleDiff(facingDir, this.targetDir);

      for (const cell of this.cells) {
        if (cell.obj && cell.isConnected) {
          const angleFromCenterToCell = pointDir(
            this.centerOfMass.x,
            this.centerOfMass.y,
            cell.obj.position.x,
            cell.obj.position.y
          );
          const distToCenter = pointDist(
            this.centerOfMass.x,
            this.centerOfMass.y,
            cell.obj.position.x,
            cell.obj.position.y
          );
          const distToBrain = pointDist(
            cell.offset.x,
            cell.offset.y,
            this.brain.offset.x,
            this.brain.offset.y
          );

          // replace with vector rotation
          // const dist = pointDist(0, 0, cell.offset.x, cell.offset.y);
          // const dir = pointDir(0, 0, cell.offset.x, cell.offset.y);
          //
          // const targetPosX =
          //   cell.obj.position.x +
          //   lengthDirX(
          //     dist * SPACING,
          //     dir + this.targetDir - saveData.direction + 90
          //   );
          // const targetPosY =
          //   cell.obj.position.y +
          //   lengthDirY(
          //     dist * SPACING,
          //     dir + this.targetDir - saveData.direction + 90
          //   );

          // const diff = angleDiff(angleFromCenterToCell, angleFromCenterToTarget);
          // const distToTarget = pointDist(
          //   cell.obj.position.x,
          //   cell.obj.position.y,
          //   targetPosX,
          //   targetPosY
          // );

          // const diff = angleDiff(angleFromCenterToCell, this.targetDir + 180);

          const forcePos = {
            x:
              cell.obj.position.x +
              lengthDirX(Math.max(distToCenter, 80), angleFromCenterToCell),
            y:
              cell.obj.position.y +
              lengthDirY(Math.max(distToCenter, 80), angleFromCenterToCell),
          };

          const intensity =
            (-0.000001 *
              Math.min(Math.pow(diffToTarget, 2), 2500) *
              Math.sign(diffToTarget)) /
            (distToBrain + 12);

          const force = {
            x: lengthDirX(intensity, angleFromCenterToCell + 90),
            y: lengthDirY(intensity, angleFromCenterToCell + 90),
          };

          // const drawForce = {
          //   x: lengthDirX(
          //     -0.05 *
          //       Math.min(Math.pow(diffToTarget, 2), 2500) *
          //       Math.sign(diffToTarget),
          //     angleFromCenterToCell + 90
          //   ),
          //   y: lengthDirY(
          //     -0.05 *
          //       Math.min(Math.pow(diffToTarget, 2), 2500) *
          //       Math.sign(diffToTarget),
          //     angleFromCenterToCell + 90
          //   ),
          // };

          // if (this.debug) {
          //   this.debug.lineBetween(
          //     forcePos.x,
          //     forcePos.y,
          //     forcePos.x + drawForce.x,
          //     forcePos.y + drawForce.y
          //   );
          // }

          matter.body.applyForce(cell.obj.parent, forcePos, force);
          // matter.applyForce(cell.obj.parent, force);

          // const turnFactor = 0.0000008 * Math.min(diff, 100);
          const moveFactor =
            (0.00000405 * (180 - Math.min(Math.abs(diffToTarget), 80))) /
            (distToBrain + 3);

          // const turnFactor = 0.0001;

          // matter.applyForce(cell.obj.parent, {
          //   x:
          //     lengthDirX(
          //       turnFactor,
          //       angleFromCenterToCell - 90 * Math.sign(diff)
          //     ) + lengthDirX(moveFactor, this.targetDir),
          //   y:
          //     lengthDirY(
          //       turnFactor,
          //       angleFromCenterToCell - 90 * Math.sign(diff)
          //     ) + lengthDirY(moveFactor, this.targetDir),
          // });

          // console.log(distToTarget);
          // console.log(angleFromCenterToCell);

          // if (distToCenter < 10) {
          // cell.obj.parent.torque -= 0.0001 * cell.obj.parent.mass * diff;
          // }

          // rotate bones
          // if (cell.obj.parent !== cell.obj) {
          //   if (cell.obj.parent.parts[1] === cell.obj) {
          //     const diff2 = angleDiff(
          //       RadToDeg(cell.obj.parent.angle),
          //       this.targetDir
          //     );
          //
          //     cell.obj.parent.torque -=
          //       0.00035 *
          //       cell.obj.parent.mass *
          //       Math.min(Math.abs(diff2), 40) *
          //       Math.sign(diff2);
          //   }
          // }

          matter.applyForce(cell.obj.parent, {
            x: lengthDirX(moveFactor, this.targetDir),
            y: lengthDirY(moveFactor, this.targetDir),
          });

          // if (this.debug) {
          //   this.debug.lineBetween(
          //     cell.obj.position.x,
          //     cell.obj.position.y,
          //     cell.obj.position.x +
          //       lengthDirX(moveFactor * 10000, this.targetDir),
          //     cell.obj.position.y +
          //       lengthDirY(moveFactor * 10000, this.targetDir)
          //   );
          // }

          // cell.obj.torque = 0.005 * diff - cell.obj.angularVelocity;
          // cell.obj.parent.torque +=
          //   -(0.0001 * cell.obj.parent.mass) * diff -
          //   cell.obj.parent.angularVelocity / 5;

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
    }
    // }
  }

  // todo this probably fails mustBePlacedPerpendicular
  aggregateBone(startingCell: Cell): Cell[] {
    const boneCells: Cell[] = [];
    const cellsToCheck = [startingCell];

    this.cells.forEach((cell) => {
      cell.beenScanned = false;
    });

    while (cellsToCheck.length) {
      const cell = cellsToCheck.pop();

      if (cell?.isBone && !cell.beenScanned) {
        cell.beenScanned = true;

        boneCells.push(cell);
        cellsToCheck.push(...cell.getSurroundingCells());
      }
    }

    return boneCells;
  }

  setisConnected(cellToRemove?: Cell) {
    const cellsToCheck = compact([
      (this.brain?.health || 0) > 0 ? this.brain : undefined,
    ]);

    this.cells.forEach((cell) => {
      cell.isConnected = false;
      cell.beenScanned = false;
    });

    while (cellsToCheck.length) {
      const cell = cellsToCheck.pop();

      if (cell && !cell.beenScanned) {
        cell.beenScanned = true;

        if (cell !== cellToRemove) {
          cell.isConnected = true;
          cellsToCheck.push(...cell.getSurroundingCells());
        }
      }
    }
  }

  syncCells(matter?: Phaser.Physics.Matter.MatterPhysics) {
    if (matter) {
      this.cells = compact(
        this.cells.map((cell) => {
          if (cell.health <= 0) {
            cell.destroy(matter);
          } else {
            return cell;
          }
        })
      );

      this.cells.forEach((cell) => this.createBones(matter, cell));
      this.cells.forEach((cell) => this.syncLinks(matter, cell));
    }

    this.cells.forEach((cell) => cell.setChildrenCells());

    this.setisConnected();
  }

  overlapsWith(
    occupiedSpots: Vector[],
    spot: ISpotAndOffset,
    startAngle: number
  ): boolean {
    const transformedOccupiedSpots = occupiedSpots.map((occupiedSpot) =>
      rotateVector({ x: 0, y: 0 }, occupiedSpot, spot.offset - startAngle)
    );

    return this.cells.some((cell) => {
      const transformedCellOccupiedSpots = cell.occupiedSpots.map(
        (occupiedSpot) =>
          rotateVector({ x: 0, y: 0 }, occupiedSpot, cell.angleOffset - 30)
      );

      return transformedOccupiedSpots.some((occupiedSpot) =>
        transformedCellOccupiedSpots.some((occSpot) => {
          return (
            floatEquals(
              cell.offset.x + occSpot.x,
              spot.pos.x + occupiedSpot.x
            ) &&
            floatEquals(cell.offset.y + occSpot.y, spot.pos.y + occupiedSpot.y)
          );
        })
      );
    });
  }

  // overlapsWith(
  //   occupiedSpots: Vector[],
  //   spot: ISpotAndOffset,
  //   startAngle: number
  // ): boolean {
  //   const transformedOccupiedSpots = occupiedSpots.map((occupiedSpot) =>
  //     rotateVector(
  //       { x: 0, y: 0 },
  //       occupiedSpot,
  //       spot.offset + 90 + 60 - startAngle
  //     )
  //   );
  //
  //   return this.cells.some((cell) => {
  //     // const transformedCellOccupiedSpots = cell.occupiedSpots.map(
  //     //   (occupiedSpot) =>
  //     //     rotateVector({ x: 0, y: 0 }, occupiedSpot, cell.angleOffset + 90 + 60)
  //     // );
  //
  //     return transformedOccupiedSpots.some((occupiedSpot) =>
  //       cell.occupiedSpots.some((occSpot) => {
  //         return (
  //           floatEquals(
  //             cell.offset.x + occSpot.x,
  //             spot.pos.x + occupiedSpot.x
  //           ) &&
  //           floatEquals(cell.offset.y + occSpot.y, spot.pos.y + occupiedSpot.y)
  //         );
  //       })
  //     );
  //   });
  // }

  // overlapsWith(occupiedSpots: Vector[], spot: ISpotAndOffset): boolean {
  //   return this.cells.some((cell) =>
  //     occupiedSpots.some((occupiedSpot) =>
  //       cell.occupiedSpots.some(
  //         (occSpot) =>
  //           floatEquals(
  //             cell.offset.x + occSpot.x,
  //             spot.pos.x + occupiedSpot.x
  //           ) &&
  //           floatEquals(cell.offset.y + occSpot.y, spot.pos.y + occupiedSpot.y)
  //       )
  //     )
  //   );
  // }

  getAvailableSpots(cells: Cell[], startAngle: number): IAvailableSpot[] {
    const storedSpots: IAvailableSpot[] = [];
    const shapes: Vector[] = cells.flatMap((cell) =>
      cell.occupiedSpots.map((occupiedSpot) =>
        addVectors(
          rotateVector({ x: 0, y: 0 }, occupiedSpot, cell.angleOffset - 30),
          cell.offset
        )
      )
    );

    if (!this.cells.length) {
      return [{ pos: { x: 0, y: 0 }, availableOffsets: [] }];
    }

    this.cells
      .flatMap((cell) => cell.getSurroundingAvailableSpots())
      .forEach((spot) => {
        const overlaps = this.overlapsWith(shapes, spot, startAngle);

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

  addCells(cells: Cell[]) {
    this.cells.push(...cells);
    this.syncCells();
  }

  removeCells(cells: Cell[]) {
    this.cells = this.cells.filter((c) => !cells.includes(c));
    this.syncCells();
  }

  destroy(matter?: Phaser.Physics.Matter.MatterPhysics) {
    this.skinShader?.destroy();
    this.skin?.destroy();
    this.cells.forEach((cell) => cell.destroy(matter));
    this.cells = [];
  }
}
