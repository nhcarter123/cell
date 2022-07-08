import { pointDir, pointDist, subtractVectors } from "../helpers/math";
import { Organism } from "../objects/organism";
import { Cell } from "../objects/cells/cell";
import { compact } from "lodash";
import { ESceneKey } from "../index";
import { loadOrganism, saveData } from "../context/saveData";
import star from "../savedOrganisms/star";
import config from "../config";
import OutlinePipelinePlugin from "phaser3-rex-plugins/plugins/outlinepipeline-plugin";

interface IFindResult {
  closestCellDist: number;
  closestCell: Cell | undefined;
}

const BACKGROUND_DEPTH = 300;

export default class Ocean extends Phaser.Scene {
  private organisms: Organism[];
  private backgroundShader?: Phaser.GameObjects.Shader;
  private leftButtonPressed: boolean;
  private pipelineInstance?: OutlinePipelinePlugin;

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
            // showBody: false,
          },
        },
      },
    });

    this.organisms = [];
    this.leftButtonPressed = false;
  }

  create() {
    // this.matter.add.mouseSpring();
    // this.debugCircle = this.add.circle(0, 0, 20, 0xffffff);
    this.organisms = [
      loadOrganism(saveData.organism),
      loadOrganism({
        isPlayer: false,
        x: 600,
        y: 600,
        cells: star,
      }),
    ];

    this.pipelineInstance = this.plugins.get(
      "rexOutlinePipeline"
    ) as OutlinePipelinePlugin;

    this.backgroundShader = this.add.shader(
      "ocean",
      0,
      0,
      config.screenWidth,
      config.screenHeight
    );
    this.backgroundShader.scale = 2;
    // back.x = -200;
    this.backgroundShader.depth = -100;

    this.matter.add.rectangle(400, 200, 200, 150, {
      restitution: 0.9,
      isStatic: true,
    });

    // create cells
    this.organisms.forEach((org) =>
      org.create(this.add, this.pipelineInstance, this.matter, this)
    );

    // setup camera
    const player = this.organisms.find((org) => org.isPlayer);

    if (player?.brain?.image) {
      this.cameras.main.startFollow(player.brain.image, false, 0.015, 0.015);
      this.cameras.main.fadeIn(1000);
      this.cameras.main.zoom = 1.1;
      // this.cameras.main.setPosition(100), 100;
    }
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    if (this.backgroundShader) {
      this.backgroundShader.setUniform("offset.value", [
        this.cameras.main.scrollX / BACKGROUND_DEPTH,
        -this.cameras.main.scrollY / BACKGROUND_DEPTH,
      ]);
      this.backgroundShader.x =
        this.cameras.main.scrollX + config.screenWidth / 2;
      this.backgroundShader.y =
        this.cameras.main.scrollY + config.screenHeight / 2;
      this.backgroundShader.scale = 1 / this.cameras.main.zoom;
    }

    // if (this.debugCircle) {
    //   this.debugCircle.x =
    //     this.input.mousePointer.x + this.cameras.main.scrollX;
    //   this.debugCircle.y =
    //     this.input.mousePointer.y + this.cameras.main.scrollY;
    // }

    const mouseX = this.input.mousePointer.x + this.cameras.main.scrollX;
    const mouseY = this.input.mousePointer.y + this.cameras.main.scrollY;

    if (this.input.mousePointer.leftButtonDown()) {
      if (!this.leftButtonPressed) {
        this.leftButtonPressed = true;
      }
      // const diff = angleDiff(org.avgAngle, angleToMouse);

      // console.log(
      //   pointDir(500, 500, this.input.mousePointer.x, this.input.mousePointer.y)
      // );

      // const surroundingCells = org.brain.getSurroundingCells();
    }

    if (this.input.mousePointer.leftButtonReleased()) {
      this.leftButtonPressed = false;
    }

    this.organisms.forEach((org) => {
      if (this.input.mousePointer.leftButtonDown() && org.isPlayer) {
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

      org.update(this.input.mousePointer.leftButtonDown(), this.matter);

      if (org.isPlayer && org.brain?.obj) {
        // console.log(org.centerOfMass.x);
        // this.cameras.main.setFollowOffset(
        //   org.centerOfMass.x,
        //   org.centerOfMass.y
        // );
        const offset = subtractVectors(
          org.brain.obj.position,
          org.centerOfMass
        );
        this.cameras.main.setFollowOffset(offset.x / 4, offset.y / 4);
      }
    });
  }

  findClosestCell(x: number, y: number, isPlayer: boolean): IFindResult {
    let closestCellDist = Infinity;
    let closestCell = undefined;

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

            if (dist < closestCellDist) {
              closestCellDist = dist;
              closestCell = cell;
            }
          }
        });
      }
    });

    return { closestCell, closestCellDist };
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
}
