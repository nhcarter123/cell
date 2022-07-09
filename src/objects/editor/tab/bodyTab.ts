import { Tab } from "./tab";
import { EImageKey } from "../../../scenes/load";
import { FatCellContent } from "../shopContent/fatCellContent";
import { BrainCellContent } from "../shopContent/brainCellContent";
import { BoneCellContent } from "../shopContent/boneCellContent";

export class BodyTab extends Tab {
  constructor() {
    super(EImageKey.FatCell, [
      new FatCellContent(),
      new BrainCellContent(),
      new BoneCellContent(),
      new BoneCellContent(),
      new BoneCellContent(),
      new BoneCellContent(),
      new BoneCellContent(),
    ]);
  }
}
