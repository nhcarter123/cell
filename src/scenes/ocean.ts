import {
  lengthDirX,
  lengthDirY,
  lerp,
  pointDir,
  pointDist,
} from "../helpers/math";
import { Organism } from "../objects/organism";
import { Cell } from "../objects/cells/cell";
import { compact } from "lodash";
import { ESceneKey } from "../index";
import { ISavedCell, loadOrganism, saveData } from "../context/saveData";
import star from "../savedOrganisms/star";
import config from "../config";
import { Vector } from "matter";
import org1 from "../savedOrganisms/org1";

interface IFindResult<T> {
  closestDist: number;
  closest: T | undefined;
}

const BACKGROUND_DEPTH = 300;

export default class Ocean extends Phaser.Scene {
  private organisms: Organism[];
  private backgroundShader?: Phaser.GameObjects.Shader;
  private leftButtonPressed: boolean;
  private targetZoom: number;
  private nextClosestDist: number;
  private targetOffset: Vector;
  private player?: Organism;

  constructor() {
    super({
      key: ESceneKey.Ocean,
      physics: {
        default: "matter",
        matter: {
          // enableSleeping: true,
          gravity: {
            y: 0,
          },
          debug: {
            showJoint: false,
            showBody: false,
          },
        },
      },
    });

    this.organisms = [];
    this.leftButtonPressed = false;
    this.nextClosestDist = 0;
    this.targetZoom = 1;
    this.targetOffset = { x: 0, y: 0 };
  }

  create() {
    // this.matter.add.mouseSpring();
    // this.debugCircle = this.add.circle(0, 0, 20, 0xffffff);

    this.backgroundShader = this.add.shader(
      "ocean",
      0,
      0,
      config.screenWidth,
      config.screenHeight
    );
    this.backgroundShader.depth = -100;

    // this.matter.add.rectangle(400, 200, 200, 150, {
    //   restitution: 0.9,
    //   isStatic: true,
    // });
  }

  init() {
    this.player = loadOrganism(saveData.organism);

    this.organisms = [this.player];

    // create cells
    this.organisms.forEach((org) => org.create(this.add, this.matter, this));

    if (this.player.brain?.image) {
      this.cameras.main.startFollow(this.player.brain.image, false, 0.03, 0.03);
      // this.cameras.main.startFollow(this.player.brain.image, false);
      this.cameras.main.fadeIn(1000);
      // this.cameras.main.setPosition(100), 100;
    }
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    // console.log(this.cameras.main.scrollX);
    if (this.backgroundShader) {
      this.backgroundShader.setUniform("scale.value", this.cameras.main.zoom);
      this.backgroundShader.setUniform("offset.value", [
        this.cameras.main.scrollX / BACKGROUND_DEPTH / config.resolutionScale,
        -this.cameras.main.scrollY / BACKGROUND_DEPTH / config.resolutionScale,
      ]);
      this.backgroundShader.setOrigin(0.5, 0.5);
      this.backgroundShader.setSize(config.screenWidth, config.screenHeight);
      this.backgroundShader.x =
        this.cameras.main.scrollX + config.screenWidth / 2;
      this.backgroundShader.y =
        this.cameras.main.scrollY + config.screenHeight / 2;
      this.backgroundShader.scale = 1 / this.cameras.main.zoom;
      // this.backgroundShader.setOrigin(0, 0);
    }

    // if (this.debugCircle) {
    //   this.debugCircle.x =
    //     this.input.activePointer.x + this.cameras.main.scrollX;
    //   this.debugCircle.y =
    //     this.input.activePointer.y + this.cameras.main.scrollY;
    // }

    const mouseX = this.input.activePointer.x + this.cameras.main.scrollX;
    const mouseY = this.input.activePointer.y + this.cameras.main.scrollY;

    if (this.input.activePointer.leftButtonDown()) {
      if (!this.leftButtonPressed) {
        this.leftButtonPressed = true;
      }
      // const diff = angleDiff(org.avgAngle, angleToMouse);

      // console.log(
      //   pointDir(500, 500, this.input.activePointer.x, this.input.activePointer.y)
      // );

      // const surroundingCells = org.brain.getSurroundingCells();
    }

    if (this.input.activePointer.leftButtonReleased()) {
      this.leftButtonPressed = false;
    }

    this.organisms.forEach((org) => {
      const distanceToPlayer =
        !org.isPlayer && this.player
          ? pointDist(
              this.player.centerOfMass.x,
              this.player.centerOfMass.y,
              org.centerOfMass.x,
              org.centerOfMass.y
            )
          : 0;

      const screenSize = Math.max(config.screenWidth, config.screenHeight) / 2;

      const deletionDistance = screenSize + 1300;
      const placementDistance = screenSize + 400;

      if (distanceToPlayer < deletionDistance) {
        if (this.input.activePointer.leftButtonDown() && org.isPlayer) {
          org.targetDir = pointDir(
            org.centerOfMass.x,
            org.centerOfMass.y,
            mouseX,
            mouseY
          );

          org.moveTowards(this.matter);
        }

        org.calcCenterOfMass();
        // org.simulateMovement(this.matter);

        org.update(
          org.isPlayer ? this.input.activePointer.leftButtonDown() : true,
          this.matter
        );

        if (org.isPlayer && org.brain?.obj) {
          // console.log(org.centerOfMass.x);
          // this.cameras.main.setFollowOffset(
          //   org.centerOfMass.x,
          //   org.centerOfMass.y
          // );
          // const offset = subtractVectors(
          //   org.brain.obj.position,
          //   org.centerOfMass
          // );
          this.targetZoom =
            (1.3 - org.brain.obj.speed / 8) / config.resolutionScale;
          this.targetOffset = {
            x: -org.brain.obj.velocity.x * 70,
            y: -org.brain.obj.velocity.y * 70,
          };

          if (this.organisms.length < 10) {
            const variance = (Math.random() - 0.5) * 1100;

            const dir = pointDir(
              0,
              0,
              org.brain.obj.velocity.x,
              org.brain.obj.velocity.y
            );

            const spawnPos = {
              x:
                org.centerOfMass.x +
                lengthDirX(placementDistance, dir) +
                lengthDirX(variance, dir + 90),
              y:
                org.centerOfMass.y +
                lengthDirY(placementDistance, dir) +
                lengthDirY(variance, dir + 90),
            };

            const result = this.findClosestOrganism(
              spawnPos.x,
              spawnPos.y,
              org.id
            );

            if (result.closestDist > 500 + this.nextClosestDist) {
              this.nextClosestDist = Math.random() * 1800;
              console.log("spawned");

              const rgb = `rgb(${Math.round(Math.random() * 255)},${Math.round(
                Math.random() * 255
              )},${Math.round(Math.random() * 255)})`;

              const newOrg = loadOrganism({
                isPlayer: false,
                x: spawnPos.x,
                y: spawnPos.y,
                color: rgb,
                cells: this.getRandomOrganism(),
              });
              newOrg.create(this.add, this.matter, this, Math.random() * 360);

              this.organisms.push(newOrg);
            }
          }
        }
      } else {
        this.removeOrganism(org);
      }
    });

    this.cameras.main.zoom = lerp(
      this.cameras.main.zoom,
      this.targetZoom,
      0.015
    );

    this.cameras.main.setFollowOffset(
      lerp(this.cameras.main.followOffset.x, this.targetOffset.x, 0.014),
      lerp(this.cameras.main.followOffset.y, this.targetOffset.y, 0.014)
    );
  }

  findClosestCell(x: number, y: number, isPlayer: boolean): IFindResult<Cell> {
    let closestDist = Infinity;
    let closest: Cell | undefined = undefined;

    this.organisms.forEach((org) => {
      if (isPlayer !== org.isPlayer) {
        org.cells.forEach((cell) => {
          if (cell.obj) {
            const dist = pointDist(
              x,
              y,
              cell.obj.position.x,
              cell.obj.position.y
            );

            if (dist < closestDist) {
              closestDist = dist;
              closest = cell;
            }
          }
        });
      }
    });

    return { closest, closestDist };
  }

  findClosestOrganism(
    x: number,
    y: number,
    ignoreId: string
  ): IFindResult<Organism> {
    let closestDist = Infinity;
    let closest: Organism | undefined = undefined;

    this.organisms.forEach((org) => {
      if (ignoreId !== org.id) {
        const dist = pointDist(x, y, org.centerOfMass.x, org.centerOfMass.y);

        if (dist < closestDist) {
          closestDist = dist;
          closest = org;
        }
      }
    });

    return { closest, closestDist };
  }

  findCellsWithinRadius(
    x: number,
    y: number,
    radius: number,
    isPlayer: boolean
  ): Cell[] {
    return compact(
      this.organisms.flatMap((org) => {
        if (isPlayer !== org.isPlayer) {
          return org.cells.map((cell) => {
            if (cell.obj) {
              const dist = pointDist(
                x,
                y,
                cell.obj.position.x,
                cell.obj.position.y
              );

              if (dist < radius) {
                return cell;
              }
            }
          });
        }
      })
    );
  }

  removeOrganism(organism: Organism) {
    this.organisms = this.organisms.filter((org) => org.id !== organism.id);
    organism.destroy(this.matter);
  }

  getRandomOrganism(): ISavedCell[] {
    const orgs = [star, org1];
    const org = orgs[Math.floor(Math.random() * orgs.length)];

    return org ? org : [];
  }
}
