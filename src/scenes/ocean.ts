import { pointDir, pointDist } from "../helpers/math";
import { FatCell } from "../objects/cells/fatCell";
import { BrainCell } from "../objects/cells/brainCell";
import { MouthCell } from "../objects/cells/mouthCell";
import { Organism } from "../objects/organism";
import { Cell } from "../objects/cells/cell";
import { compact } from "lodash";
import GameScene, { RAD_3_OVER_2 } from "./gameScene";

const org1 = new Organism(true, 400, 400, [
  new FatCell(-0.5, -RAD_3_OVER_2),
  new FatCell(0.5, -RAD_3_OVER_2),

  new BrainCell(0, 0),
  new FatCell(-1, 0),
  new FatCell(1, 0),
  new MouthCell(2, 0),

  new FatCell(-0.5, RAD_3_OVER_2),
  new FatCell(0.5, RAD_3_OVER_2),

  new FatCell(-2, 0),
  new FatCell(-3, 0),
  new FatCell(-4, 0),
]);
const org2 = new Organism(false, 800, 400, [
  new FatCell(-0.5, -RAD_3_OVER_2),
  new FatCell(0.5, -RAD_3_OVER_2),

  new BrainCell(0, 0),
  new FatCell(-1, 0),
  new FatCell(1, 0),

  new FatCell(-0.5, RAD_3_OVER_2),
  new FatCell(0.5, RAD_3_OVER_2),

  new FatCell(0, 2 * RAD_3_OVER_2),
  new FatCell(-1, 2 * RAD_3_OVER_2),
  new FatCell(1, 2 * RAD_3_OVER_2),

  new FatCell(-0.5, 3 * RAD_3_OVER_2),
  new FatCell(0.5, 3 * RAD_3_OVER_2),
]);

const organisms: Organism[] = [org1, org2];

interface IFindResult {
  closestCellDist: number;
  closestCell: Cell | undefined;
}

export const findClosestCell = (x: number, y: number): IFindResult => {
  let closestCellDist = Infinity;
  let closestCell = undefined;

  organisms.forEach((org) => {
    if (!org.isPlayer) {
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
};

export const findCellsWithinRadius = (
  x: number,
  y: number,
  radius: number
): Cell[] => {
  return compact(
    organisms.flatMap((org) => {
      if (!org.isPlayer) {
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
};

export default class Ocean extends GameScene {
  private debugCircle?: Phaser.GameObjects.Arc;

  constructor() {
    super({
      physics: {
        default: "matter",
        matter: {
          // enableSleeping: true,
          gravity: {
            y: 0,
          },
          debug: {
            // showJoint: false,
            showBody: false,
          },
        },
      },
    });
  }

  create() {
    // this.matter.add.mouseSpring();
    // this.debugCircle = this.add.circle(0, 0, 20, 0xffffff);

    this.matter.add.rectangle(1000, 500, 200, 150, {
      restitution: 0.9,
      isStatic: true,
    });

    // create cells
    organisms.forEach((org) => org.create(this.add, this.matter));

    // setup camera
    const player = organisms.find((org) => org.isPlayer);

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

    organisms.forEach((org) =>
      org.cells.forEach((cell) =>
        cell.update(this.matter, this.input.mousePointer.leftButtonDown())
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

    organisms.forEach((org) => {
      let targetDir = 0;

      if (org.isPlayer) {
        targetDir = pointDir(
          org.avgPosition.x,
          org.avgPosition.y,
          mouseX,
          mouseY
        );
      }

      org.calcCenterOfMass(targetDir);

      if (this.input.mousePointer.leftButtonDown() && org.isPlayer) {
        org.moveTowards(targetDir, this.matter);
      }
    });
  }
}