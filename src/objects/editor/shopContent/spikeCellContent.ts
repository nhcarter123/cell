import { EImageKey } from "../../../scenes/load";
import { ShopContent } from "./shopContent";
import { ECellType } from "../../../events/eventCenter";

export class SpikeCellContent extends ShopContent {
  constructor() {
    super(1, 5, EImageKey.SpikeCell, ECellType.SpikeCell);

    this.scale = 0.5;
  }
}
