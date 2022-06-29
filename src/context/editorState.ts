import { Cell } from "../objects/cells/cell";
import { ECellType } from "../events/eventCenter";
import DegToRad = Phaser.Math.DegToRad;
import { SPACING } from "../scenes/gameScene";
import { Vector } from "matter";
import { addVectors, rotateVector } from "../helpers/math";

class EditorState {
  public mouseCells: Cell[];
  public type: ECellType;

  constructor() {
    this.type = ECellType.FatCell;
    this.mouseCells = [];
  }

  setMouseCellsPosition(x: number, y: number, alpha: number) {
    this.mouseCells.forEach((cell) => {
      if (cell.image) {
        cell.image.x = x + cell.offset.x * SPACING;
        cell.image.y = y + cell.offset.y * SPACING;
        cell.image.alpha = alpha;
      }
    });
  }

  setMouseCellsOffset(offset: Vector) {
    this.mouseCells.forEach((cell) => {
      cell.offset = addVectors(cell.offset, offset);
    });
  }

  rotateMouseCells() {
    this.mouseCells.forEach((cell) => {
      cell.angleOffset = (cell.angleOffset + 60) % 360;

      if (cell.image) {
        cell.image.rotation = DegToRad(cell.angleOffset);
      }
      cell.offset = rotateVector({ x: 0, y: 0 }, cell.offset, 180 + 60);
      cell.occupiedSpots = cell.occupiedSpots.map((spot) =>
        rotateVector({ x: 0, y: 0 }, spot, 180 + 60)
      );
    });
  }
}

const editorState = new EditorState();

export default editorState;
