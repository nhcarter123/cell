import { EImageKey } from "../../../scenes/gameScene";
import { EDITOR_WIDTH } from "../../../index";
import { ShopContent } from "../shopContent/shopContent";

export const DEFAULT_TAB_COLOR =
  Phaser.Display.Color.ValueToColor("#727272").color;
export const HOVERED_TAB_COLOR =
  Phaser.Display.Color.ValueToColor("#b1b1b1").color;
export const SELECTED_TAB_COLOR =
  Phaser.Display.Color.ValueToColor("#3e3e3e").color;
const strokeColor = Phaser.Display.Color.ValueToColor("#545454").color;

const ITEMS_PER_ROW = 5;

export class Tab {
  public background?: Phaser.GameObjects.Rectangle;
  private readonly imageKey: EImageKey;
  private image?: Phaser.GameObjects.Image;
  public contents: ShopContent[];

  constructor(imageKey: EImageKey, contents: ShopContent[]) {
    this.imageKey = imageKey;
    this.contents = contents;
  }

  create(
    add: Phaser.GameObjects.GameObjectFactory,
    width: number,
    height: number,
    index: number,
    onBuy: Function
  ) {
    this.background = add
      .rectangle(
        index * width + width / 2 + 4,
        height / 2,
        width,
        height,
        DEFAULT_TAB_COLOR
      )
      .setInteractive();

    this.background.setStrokeStyle(8, strokeColor);

    this.image = add.image(
      width / 2 + index * width,
      height / 2,
      this.imageKey
    );
    this.image.scale = 0.75;

    this.contents.forEach((content, index) => {
      const step = (EDITOR_WIDTH - 20) / ITEMS_PER_ROW;
      content.create(add, step * index + 60, height + 60, onBuy);
    });
  }
}
