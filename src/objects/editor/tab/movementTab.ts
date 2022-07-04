import { Tab } from "./tab";
import { EImageKey } from "../../../scenes/gameScene";
import { CiliaCellContent } from "../shopContent/ciliaCellContent";

export class MovementTab extends Tab {
  constructor() {
    super(EImageKey.CiliaCell, [new CiliaCellContent()]);
  }
}
