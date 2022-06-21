import { Tab } from "./tab";
import { EImageKey } from "../../../scenes/gameScene";
import { ShopContent } from "../shopContent";

export class MouthTab extends Tab {
  constructor() {
    super(EImageKey.MouthCell, [
      new ShopContent(),
      new ShopContent(),
      new ShopContent(),
      new ShopContent(),
    ]);
  }
}
