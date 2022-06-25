import { EImageKey } from "../../../scenes/gameScene";
import { EDITOR_WIDTH } from "../../../index";
import { ShopContent } from "../shopContent/shopContent";
import { Button } from "./button";

export const DEFAULT_TAB_COLOR =
  Phaser.Display.Color.ValueToColor("#727272").color;
export const HOVERED_TAB_COLOR =
  Phaser.Display.Color.ValueToColor("#b1b1b1").color;
export const SELECTED_TAB_COLOR =
  Phaser.Display.Color.ValueToColor("#3e3e3e").color;
export const STROKE_COLOR = Phaser.Display.Color.ValueToColor("#545454").color;

const ITEMS_PER_ROW = 5;

export class Tab extends Button {
  private readonly imageKey: EImageKey;
  private image?: Phaser.GameObjects.Image;
  public contents: ShopContent[];

  constructor(imageKey: EImageKey, contents: ShopContent[]) {
    super();

    this.imageKey = imageKey;
    this.contents = contents;
  }

  create(
    add: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    width: number,
    height: number,
    onClick: Function,
    onHover: Function,
    onExitHover: Function,
    onBuy?: Function,
    index?: number
  ) {
    super.create(add, x, y, width, height, onClick, onHover, onExitHover);

    this.image = add.image(
      width / 2 + (index || 0) * width,
      height / 2,
      this.imageKey
    );
    this.image.scale = 0.75;

    if (onBuy) {
      this.contents.forEach((content, index) => {
        const step = (EDITOR_WIDTH - 20) / ITEMS_PER_ROW;
        content.create(add, step * index + 60, height + 60, onBuy);
      });
    }
  }
}
