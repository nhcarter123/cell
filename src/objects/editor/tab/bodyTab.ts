import { Tab } from "./tab";
import { EImageKey } from "../../../scenes/gameScene";
import { FatCellContent } from "../shopContent/fatCellContent";

export class BodyTab extends Tab {
  constructor() {
    super(EImageKey.FatCell, [new FatCellContent()]);
  }
}
