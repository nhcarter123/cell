import { Tab } from "./tab";
import { EImageKey } from "../../../scenes/gameScene";
import { ShopContent } from "../shopContent";

export class DefenceTab extends Tab {
  constructor() {
    super(EImageKey.FatCell, [
      new ShopContent(),
      new ShopContent(),
      new ShopContent(),
      new ShopContent(),
    ]);
  }
}
