import { Tab } from "./tab";
import { EImageKey } from "../../../scenes/gameScene";
import { MouthCellContent } from "../shopContent/mouthCellContent";

export class DefenseTab extends Tab {
  constructor() {
    super(EImageKey.FatCell, [
      new MouthCellContent(),
      new MouthCellContent(),
      new MouthCellContent(),
      new MouthCellContent(),
    ]);
  }
}
