import { Cell } from "../objects/cells/cell";
import { ECellType } from "../events/eventCenter";
import { SPACING } from "../scenes/gameScene";
import { Vector } from "matter";
import {
  addVectors,
  angleDiff,
  rotateVector,
  safeAngle,
} from "../helpers/math";

class EditorState {
  public mouseCells: Cell[];
  public type: ECellType;
  public angle: number;

  constructor() {
    this.type = ECellType.FatCell;
    this.mouseCells = [];
    this.angle = 0;
  }

  setMouseCellsPosition(x: number, y: number, alpha: number) {
    const firstMouseCell = this.mouseCells[0];

    let rotate = 0;
    if (firstMouseCell && firstMouseCell.angleOffset !== this.angle) {
      rotate = angleDiff(firstMouseCell.angleOffset, this.angle);
    }

    this.mouseCells.forEach((cell) => {
      if (cell.image) {
        cell.image.x = x + cell.offset.x * SPACING;
        cell.image.y = y + cell.offset.y * SPACING;
        cell.image.alpha = alpha;
      }

      if (rotate !== 0) {
        cell.offset = rotateVector({ x: 0, y: 0 }, cell.offset, -rotate);
        cell.angleOffset = safeAngle(cell.angleOffset - rotate);
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
      cell.angleOffset = safeAngle(cell.angleOffset + 60);

      if (cell.image) {
        cell.image.angle = cell.angleOffset;
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
