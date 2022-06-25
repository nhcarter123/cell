import { ECellType } from "../events/eventCenter";
import { Cell } from "../objects/cells/cell";
import { MouthCell } from "../objects/cells/mouthCell";
import { FatCell } from "../objects/cells/fatCell";
import { BrainCell } from "../objects/cells/brainCell";
import { Organism } from "../objects/organism";

type TSavedCell = Pick<Cell, "offsetX" | "offsetY">;
type TSavedOrganism = Pick<Organism, "isPlayer">;

interface ISavedCell extends TSavedCell {
  type: ECellType;
}

interface ISavedOrganism extends TSavedOrganism {
  cells: ISavedCell[];
  x: number;
  y: number;
}

interface ISaveData {
  organism: ISavedOrganism;
}

export const saveData: ISaveData = {
  organism: {
    isPlayer: true,
    x: 0,
    y: 0,
    cells: [
      {
        type: ECellType.BrainCell,
        offsetX: 0,
        offsetY: 0,
      },
      {
        type: ECellType.FatCell,
        offsetX: 1,
        offsetY: 0,
      },
    ],
  },
};

export const createCellFromType = (
  type: ECellType,
  x: number,
  y: number
): Cell => {
  switch (type) {
    case ECellType.BrainCell:
      return new BrainCell(x, y);
    case ECellType.MouthCell:
      return new MouthCell(x, y);
    case ECellType.FatCell:
      return new FatCell(x, y);
  }
};

const getTypeFromCell = (cell: Cell): ECellType => {
  if (cell instanceof MouthCell) {
    return ECellType.MouthCell;
  }
  if (cell instanceof FatCell) {
    return ECellType.FatCell;
  }
  if (cell instanceof BrainCell) {
    return ECellType.BrainCell;
  }

  return ECellType.FatCell;
};

export const loadOrganism = (savedOrganism: ISavedOrganism): Organism => {
  return new Organism(
    savedOrganism.isPlayer,
    savedOrganism.x,
    savedOrganism.y,
    savedOrganism.cells.map((cell) =>
      createCellFromType(cell.type, cell.offsetX, cell.offsetY)
    )
  );
};

export const saveOrganism = (organism: Organism): ISavedOrganism => {
  const center = organism.getCenter(); // todo tests if it should use center of mass instead

  return {
    isPlayer: organism.isPlayer,
    x: center.x,
    y: center.y,
    cells: organism.cells.map((cell) => ({
      type: getTypeFromCell(cell),
      offsetX: cell.offsetX,
      offsetY: cell.offsetY,
    })),
  };
};
