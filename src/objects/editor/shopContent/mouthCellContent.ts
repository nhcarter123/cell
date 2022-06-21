import { EImageKey } from "../../../scenes/gameScene";
import { ShopContent } from "./shopContent";

export class MouthCellContent extends ShopContent {
  constructor() {
    super(1, 5, EImageKey.MouthCell);
  }

  create(
    add: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    onBuy: Function
  ) {
    super.create(add, x, y, onBuy);
  }
}
