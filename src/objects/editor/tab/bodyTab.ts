import { Tab } from "./tab";
import { EImageKey } from "../../../scenes/gameScene";
import { FatCellContent } from "../shopContent/fatCellContent";
import { BrainCellContent } from "../shopContent/brainCellContent";

export class BodyTab extends Tab {
  constructor() {
    super(EImageKey.FatCell, [new FatCellContent(), new BrainCellContent()]);
  }
}
