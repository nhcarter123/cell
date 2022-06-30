import { angleDiff, pointDir, pointDist } from "../helpers/math";
import { Organism } from "../objects/organism";
import { Cell } from "../objects/cells/cell";
import { compact } from "lodash";
import GameScene, { EImageKey } from "./gameScene";
import { ESceneKey } from "../index";
import { loadOrganism, saveData } from "../context/saveData";
import star from "../savedOrganisms/star";

interface IFindResult {
  closestCellDist: number;
  closestCell: Cell | undefined;
}

export default class Ocean extends GameScene {
  private debugCircle?: Phaser.GameObjects.Arc;
  private organisms: Organism[];

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
            // showJoint: false,
            // showBody: false,
          },
        },
      },
    });

    this.organisms = [];
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

    this.matter.add.rectangle(400, 200, 200, 150, {
      restitution: 0.9,
      isStatic: true,
    });

    // create cells
    this.organisms.forEach((org) => org.create(this.add, this.matter, this));

    // setup camera
    const player = this.organisms.find((org) => org.isPlayer);

    if (player?.brain?.image) {
      this.cameras.main.startFollow(player.brain.image, false, 0.01, 0.01);
      this.cameras.main.fadeIn(1000);
      // this.cameras.main.setPosition(100), 100;
    }
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    // if (this.debugCircle) {
    //   this.debugCircle.x =
    //     this.input.mousePointer.x + this.cameras.main.scrollX;
    //   this.debugCircle.y =
    //     this.input.mousePointer.y + this.cameras.main.scrollY;
    // }

    const mouseX = this.input.mousePointer.x + this.cameras.main.scrollX;
    const mouseY = this.input.mousePointer.y + this.cameras.main.scrollY;

    this.organisms.forEach((org) =>
      org.cells.forEach((cell) =>
        cell.update(this.input.mousePointer.leftButtonDown(), this.matter)
      )
    );

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
          org.avgPosition.x,
          org.avgPosition.y,
          mouseX,
          mouseY
        );

        org.moveTowards(this.matter);
      }

      org.calcCenterOfMass();
      // org.simulateMovement(this.matter);
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
