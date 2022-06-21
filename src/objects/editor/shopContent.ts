import { EImageKey } from "../../scenes/gameScene";

export class ShopContent {
  public tier: number;
  public obj?: Phaser.GameObjects.Image;

  constructor() {
    this.tier = 1;
  }

  create(add: Phaser.GameObjects.GameObjectFactory, x: number, y: number) {
    this.obj = add.image(x, y, EImageKey.MouthCell).setInteractive();
  }
}
