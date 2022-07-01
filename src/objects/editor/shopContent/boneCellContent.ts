import { EImageKey } from "../../../scenes/gameScene";
import { ShopContent } from "./shopContent";
import { ECellType } from "../../../events/eventCenter";

export class BoneCellContent extends ShopContent {
  constructor() {
    super(1, 5, EImageKey.BoneCell, ECellType.BoneCell);
  }
}
