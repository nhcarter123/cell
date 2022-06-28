import { ECellType } from "../events/eventCenter";
import { Cell } from "../objects/cells/cell";
import { MouthCell } from "../objects/cells/mouthCell";
import { FatCell } from "../objects/cells/fatCell";
import { BrainCell } from "../objects/cells/brainCell";
import { Organism } from "../objects/organism";
import { SpikeCell } from "../objects/cells/spikeCell";

export type TSavedCell = Pick<Cell, "offsetX" | "offsetY" | "angleOffset">;
type TSavedOrganism = Pick<Organism, "isPlayer">;

export interface ISavedCell extends TSavedCell {
  type: ECellType;
}

interface ISavedOrganism extends TSavedOrganism {
  cells: ISavedCell[];
  x: number;
  y: number;
}

interface ISaveData {
  organism: ISavedOrganism;
  direction: number;
}

export const saveData: ISaveData = {
  direction: 90,
  organism: {
    isPlayer: true,
    x: 0,
    y: 0,
    cells: [
      {
        type: ECellType.BrainCell,
        angleOffset: 0,
        offsetX: 0,
        offsetY: 0,
      },
    ],
    // cells: star,
  },
};

export const updateFacingDirection = () => {
  if (
    saveData.direction === 120 ||
    saveData.direction === 180 ||
    saveData.direction === 300 ||
    saveData.direction === 0
  ) {
    saveData.direction += 60;
  } else {
    saveData.direction += 30;
  }

  if (saveData.direction >= 360) {
    saveData.direction -= 360;
  }
};

export const createCellFromType = (
  type: ECellType,
  saveData: Partial<TSavedCell>
): Cell => {
  switch (type) {
    case ECellType.BrainCell:
      return new BrainCell(saveData);
    case ECellType.MouthCell:
      return new MouthCell(saveData);
    case ECellType.FatCell:
      return new FatCell(saveData);
    case ECellType.SpikeCell:
      return new SpikeCell(saveData);
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
  if (cell instanceof SpikeCell) {
    return ECellType.SpikeCell;
  }

  return ECellType.FatCell;
};

export const loadOrganism = (savedOrganism: ISavedOrganism): Organism => {
  return new Organism(
    savedOrganism.isPlayer,
    savedOrganism.x,
    savedOrganism.y,
    savedOrganism.cells.map((cell) => createCellFromType(cell.type, cell))
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
      angleOffset: cell.angleOffset,
    })),
  };
};
