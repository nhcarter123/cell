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
  subtractVectors,
} from "../helpers/math";
import { compact } from "lodash";
import { Vector } from "matter";
import Ocean from "../scenes/ocean";
import RadToDeg = Phaser.Math.RadToDeg;
import { DAMPING, PHYSICS_DEFAULTS, SPACING, STIFFNESS } from "../config";
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

const MAX_SHADER_CELLS = 40;
const SKIN_RADIUS = 29;
const SKIN_ALPHA = 0.4;

const SKIN_OUTLINE_ALPHA = 0.7;
const SKIN_THICKNESS = 7;

const padding = SKIN_RADIUS + 10;

export class Organism {
  public id: string;
  public isPlayer: boolean;
  public brain?: BrainCell;
  public cells: Cell[];
  public centerOfMass: MatterJS.Vector;
  public ocean?: Ocean;
  public targetDir: number;
  private skinShader?: Phaser.GameObjects.Shader;
  private skinOutlineShader?: Phaser.GameObjects.Shader;
  private skin?: Phaser.GameObjects.Image;
  private debug?: Phaser.GameObjects.Graphics;
  private skinResolution: number;
  private wiggleRate: number;
  private wiggleStrength: number;
  public color: Phaser.Display.Color;
  public dirtyBones: string[];

  // stats
  public speed: number;

  constructor(
    isPlayer: boolean,
    x: number,
    y: number,
    color: Phaser.Display.Color,
    cells: Cell[]
  ) {
    this.isPlayer = isPlayer;
    this.cells = cells;
    this.brain = cells.find((cell) => cell instanceof BrainCell);
    this.centerOfMass = { x, y };
    this.skinResolution = 0;
    this.targetDir = 0;
    this.color = color;
    this.speed = 1;
    this.id = nanoid();
    this.dirtyBones = [];
    // todo add overrides
    this.wiggleRate = 0;
    this.wiggleStrength = 0;
  }

  create(
    add: Phaser.GameObjects.GameObjectFactory,
    matter?: Phaser.Physics.Matter.MatterPhysics,
    ocean?: Ocean,
    startAngle = 0
  ) {
    this.ocean = ocean;
    this.targetDir = startAngle;

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
    this.cells.forEach((cell) =>
      cell.create(this, add, this.color, matter, startAngle)
    );

    this.syncCells(matter);

    // todo this can possibly be optimized
    this.skinResolution = getMaxDiff(this.getBounds(true, padding));

    this.skinShader = add.shader(
      "skin",
      0,
      0,
      this.skinResolution,
      this.skinResolution
    );
    this.skinShader.setUniform("color.value", [
      this.color.red / 255,
      this.color.green / 255,
      this.color.blue / 255,
    ]);
    this.skinShader.setUniform("alpha.value", SKIN_ALPHA);
    this.skinShader.depth = matter ? 10 : -10;

    this.skinOutlineShader = add.shader(
      "skin",
      0,
      0,
      this.skinResolution,
      this.skinResolution
    );

    this.skinOutlineShader.setUniform("color.value", [
      this.color.red / 650,
      this.color.green / 650,
      this.color.blue / 650,
    ]);
    this.skinOutlineShader.setUniform("alpha.value", SKIN_OUTLINE_ALPHA);
    this.skinOutlineShader.depth = -12;

    // this.skin = add.image(0, 0, `skin-${this.id}`);
    // this.skin.depth = matter ? 10 : -10;
    //
    // pipeline?.add(this.skin, {
    //   // @ts-ignore the typing is just broken on this
    //   thickness: SKIN_THICKNESS,
    //   outlineColor: SKIN_OUTLINE_COLOR,
    // });
  }

  update(attacking: boolean, matter?: Phaser.Physics.Matter.MatterPhysics) {
    this.cells.forEach((cell) =>
      cell.update(this.isPlayer ? attacking : true, matter)
    );

    // const a = this.cells.sort((b, a) => (b.image?.x || 0) - (a.image?.x || 0));
    // console.log(a[0]);

    const bounds = this.getBounds(true, padding);
    const center = getCenter(bounds);
    const scale = getMaxDiff(bounds);
    const radius = SKIN_RADIUS / scale;
    const outlineRadius = (SKIN_RADIUS + SKIN_THICKNESS) / scale;
    // console.log(center);

    const cellOffsets = [];

    // console.log(center.x / maxDiff);
    const filteredCells = this.cells.filter(
      (cell) => cell?.isBody && cell.health > cell.maxHealth * 0.75
    );

    for (let i = 0; i < MAX_SHADER_CELLS; i++) {
      const cell = filteredCells[i];

      if (cell?.image) {
        cellOffsets.push((cell.image.x - center.x) / scale + 0.5);
        cellOffsets.push((-cell.image.y + center.y) / scale + 0.5);
        // }
      } else {
        cellOffsets.push(0);
        cellOffsets.push(0);
      }
    }

    if (this.skinShader && this.skinOutlineShader) {
      this.skinShader.setUniform("cells.value", cellOffsets);
      this.skinShader.setUniform("radius.value", radius);
      this.skinShader.x = center.x;
      this.skinShader.y = center.y;
      //
      // // console.log(this.skinShader.uniforms);
      this.skinShader.scale = scale / this.skinResolution;

      this.skinOutlineShader.setUniform("cells.value", cellOffsets);
      this.skinOutlineShader.setUniform("radius.value", outlineRadius);
      this.skinOutlineShader.x = center.x;
      this.skinOutlineShader.y = center.y;
      //
      // // console.log(this.skinShader.uniforms);
      this.skinOutlineShader.scale = scale / this.skinResolution;
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

  removeBones(matter: Phaser.Physics.Matter.MatterPhysics, cell: Cell) {
    if (cell.obj && this.dirtyBones.includes(cell.boneId || "")) {
      cell.boneId = undefined;
      cell.removeLinks(matter);
      matter.world.remove(cell.obj.parent);
    }
  }

  createBones(matter: Phaser.Physics.Matter.MatterPhysics, cell: Cell) {
    if (cell.isBone && !cell.boneId && cell.obj) {
      const boneCells = this.aggregateBone(cell);

      const startAngle = cell.obj.parent.angle;

      const offset = rotateVector(
        { x: 0, y: 0 },
        { x: cell.offset.x * SPACING, y: cell.offset.y * SPACING },
        RadToDeg(startAngle)
      );

      const startPosition = subtractVectors(cell.obj.position, offset);
      const boneId = nanoid();

      if (boneCells.length > 1) {
        const parts = compact(
          boneCells.map((c) => {
            c.boneId = boneId;
            c.obj && matter.world.remove(c.obj);
            c.obj = c.createBody(
              matter,
              this,
              startPosition,
              RadToDeg(startAngle)
            );
            // @ts-ignore
            c.obj.cell = c;

            return c.obj;
          })
        );

        // todo replace with concave polygon
        const compound = matter.body.create({
          parts,
          ...PHYSICS_DEFAULTS,
          angle: startAngle,
        });

        matter.world.add(compound);
      } else {
        cell.boneId = boneId;
        matter.world.remove(cell.obj);

        const startAngle = RadToDeg(cell.obj.parent.angle) - 90;

        const offset = rotateVector(
          { x: 0, y: 0 },
          { x: cell.offset.x * SPACING, y: cell.offset.y * SPACING },
          startAngle
        );

        const startPosition = subtractVectors(cell.obj.position, offset);

        cell.obj = cell.createBody(matter, this, startPosition, startAngle);
        if (cell.obj) {
          // @ts-ignore
          cell.obj.cell = cell;
          matter.world.add(cell.obj);
        }
      }
    }
  }

  syncLinks(matter: Phaser.Physics.Matter.MatterPhysics, cell: Cell) {
    if (cell.obj) {
      cell.links = compact(
        cell.links.map((l) => {
          if (l.cell.obj && l.cell.health > 0) {
            return l;
          }

          matter.world.remove(l.link);
        })
      );

      const linkableCells = cell.getLinkableCells();

      linkableCells.forEach((c) => {
        // if (c.obj?.parent !== c.obj && cell.obj?.parent !== cell.obj) {
        if (
          (c.isBone && cell.isBone) ||
          (c.links.some((link) => link.cell === cell) &&
            cell.links.some((link) => link.cell === c))
        ) {
          //
        } else {
          this.createLink(matter, cell, c);
        }
      });
    }
  }

  createLink(matter: Phaser.Physics.Matter.MatterPhysics, c1: Cell, c2: Cell) {
    if (c1.obj && c2.obj) {
      const dir = pointDir(
        c1.obj.position.x,
        c1.obj.position.y,
        c2.obj.position.x,
        c2.obj.position.y
      );
      const dist1 = pointDist(
        0,
        0,
        c1.imageOffset.x - 0.5,
        c1.imageOffset.y - 0.5
      );

      const dist2 = pointDist(
        0,
        0,
        c2.imageOffset.x - 0.5,
        c2.imageOffset.y - 0.5
      );

      const offset1 = {
        x: lengthDirX(dist1, dir + 180),
        y: lengthDirY(dist1, dir + 180),
      };

      const offset2 = {
        x: lengthDirX(dist2, dir),
        y: lengthDirY(dist2, dir),
      };

      // const offset1 = rotateVector(
      //   { x: 0, y: 0 },
      //   { x: c1.imageOffset.x - 0.5, y: c1.imageOffset.y - 0.5 },
      //   c1.angleOffset + 180
      // );
      //
      // const offset2 = rotateVector(
      //   { x: 0, y: 0 },
      //   { x: c2.imageOffset.x - 0.5, y: c2.imageOffset.y - 0.5 },
      //   c2.angleOffset + 180
      // );

      const link = matter.add.constraint(
        c1.obj.parent,
        c2.obj.parent,
        SPACING,
        c1.isDangly(c2) ? STIFFNESS * 3 : STIFFNESS,
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

  getBounds(bodyOnly = false, padding = 0): IBounds {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    if (!this.cells.length) {
      minX = 0;
      maxX = 0;
      minY = 0;
      maxY = 0;
    }

    this.cells.forEach((cell) => {
      if (cell.image && (cell.isBody || !bodyOnly)) {
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

          cell.obj.torque -= 0.002 * diff + cell.obj.angularVelocity * 0.25;

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

  moveTowards(
    matter: Phaser.Physics.Matter.MatterPhysics,
    speedMod: number,
    time: number
  ) {
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
            x: cell.obj.position.x + lengthDirX(100, angleFromCenterToCell),
            y: cell.obj.position.y + lengthDirY(100, angleFromCenterToCell),
          };

          const turnFactor =
            (-0.0000001 *
              Math.min(Math.pow(diffToTarget, 2), 2500) *
              Math.sign(diffToTarget)) /
              (distToBrain + 2) +
            Math.sin((this.wiggleRate * time) / 300) *
              0.000009 *
              this.wiggleStrength;

          const ang = angleFromCenterToCell + 90;

          const force = {
            x: lengthDirX(turnFactor, ang),
            y: lengthDirY(turnFactor, ang),
          };

          // const drawForce = {
          //   x: lengthDirX(1000000 * turnFactor, ang),
          //   y: lengthDirY(1000000 * turnFactor, ang),
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
            (this.speed *
              speedMod *
              0.0000028 *
              (180 - Math.min(Math.abs(diffToTarget), 80))) /
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

  setIsConnected(cellToRemove?: Cell) {
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
    this.speed = 0;

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
    }

    this.cells.forEach((cell) => {
      this.speed += cell.speed;
      cell.setChildrenCells();
    });

    this.setIsConnected();

    if (matter) {
      this.cells.forEach((cell) => this.removeBones(matter, cell));
      this.cells.forEach((cell) => this.createBones(matter, cell));
      this.cells.forEach((cell) => this.syncLinks(matter, cell));
      this.dirtyBones = [];
    }

    this.speed = this.speed / this.cells.length - this.cells.length / 50;
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
    this.skinOutlineShader?.destroy();
    this.skin?.destroy();
    this.cells.forEach((cell) => cell.destroy(matter));
    this.cells = [];
  }
}
