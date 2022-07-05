import { EImageKey } from "../../../scenes/load";
import { ShopContent } from "./shopContent";
import { ECellType } from "../../../events/eventCenter";

export class FatCellContent extends ShopContent {
  constructor() {
    super(1, 5, EImageKey.FatCell, ECellType.FatCell);
  }
}
