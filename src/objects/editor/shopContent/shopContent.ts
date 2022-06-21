import { EImageKey } from "../../../scenes/gameScene";

export class ShopContent {
  public readonly tier: number;
  public readonly cost: number;
  public obj?: Phaser.GameObjects.Image;
  private readonly imageKey: EImageKey;

  constructor(tier: number, cost: number, imageKey: EImageKey) {
    this.imageKey = imageKey;
    this.tier = tier;
    this.cost = cost;
  }

  create(
    add: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    onBuy: Function
  ) {
    this.obj = add
      .image(x, y, this.imageKey)
      .on("pointerdown", () => onBuy(this.cost));
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
