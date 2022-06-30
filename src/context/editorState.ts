import { Cell } from "../objects/cells/cell";
import { ECellType } from "../events/eventCenter";
import { SPACING } from "../scenes/gameScene";
import { Vector } from "matter";
import { addVectors, rotateVector, subtractVectors } from "../helpers/math";

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
      rotate = this.angle - firstMouseCell.angleOffset;
    }

    this.mouseCells.forEach((cell) => {
      if (cell.image) {
        cell.image.x = x + cell.placingOffset.x * SPACING;
        cell.image.y = y + cell.placingOffset.y * SPACING;
        cell.image.alpha = alpha;
      }

      if (rotate !== 0) {
        cell.placingOffset = rotateVector(
          { x: 0, y: 0 },
          cell.placingOffset,
          rotate - 180
        );
        cell.angleOffset += rotate;
      }
    });
  }

  setMouseCellsOffset(offset: Vector, placing: boolean) {
    this.mouseCells.forEach((cell) => {
      if (placing) {
        cell.offset = addVectors(cell.placingOffset, offset);
      } else {
        cell.placingOffset = subtractVectors(cell.offset, offset);
      }
    });
  }

  rotateMouseCells() {
    this.mouseCells.forEach((cell) => {
      cell.angleOffset = (cell.angleOffset + 60) % 360;

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
