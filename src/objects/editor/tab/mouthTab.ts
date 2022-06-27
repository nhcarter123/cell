import { Tab } from "./tab";
import { EImageKey } from "../../../scenes/gameScene";
import { MouthCellContent } from "../shopContent/mouthCellContent";

export class MouthTab extends Tab {
  constructor() {
    super(EImageKey.MouthCell, [new MouthCellContent()]);
  }
}
