import { EImageKey } from "../../../scenes/gameScene";
import { ECellType } from "../../../events/eventCenter";

export class ShopContent {
  private readonly tier: number;
  private readonly cost: number;
  private obj?: Phaser.GameObjects.Image;
  private readonly imageKey: EImageKey;
  private readonly type: ECellType;

  constructor(
    tier: number,
    cost: number,
    imageKey: EImageKey,
    type: ECellType
  ) {
    this.imageKey = imageKey;
    this.tier = tier;
    this.cost = cost;
    this.type = type;
  }

  create(
    add: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    onBuy: Function
  ) {
    this.obj = add
      .image(x, y, this.imageKey)
      .on("pointerdown", () => onBuy(this.cost, this.type));
    this.setVisible(false);
  }

  setVisible(isVisible: boolean) {
    if (this.obj) {
      if (!isVisible) {
        this.obj.visible = false;
        this.obj.disableInteractive();
      } else {
        this.obj.visible = true;
        this.obj.setInteractive();
      }
    }
  }
}
