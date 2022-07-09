import { EImageKey } from "../../../scenes/load";
import { ShopContent } from "../shopContent/shopContent";
import { Button } from "./button";
import config from "../../../config";

export const DEFAULT_TAB_COLOR =
  Phaser.Display.Color.ValueToColor("#727272").color;
export const HOVERED_TAB_COLOR =
  Phaser.Display.Color.ValueToColor("#b1b1b1").color;
export const SELECTED_TAB_COLOR =
  Phaser.Display.Color.ValueToColor("#3e3e3e").color;

const ITEMS_PER_ROW = 5;

export class Tab extends Button {
  private readonly imageKey: EImageKey;
  private image?: Phaser.GameObjects.Image;
  public contents: ShopContent[];
  public scale: number;

  constructor(imageKey: EImageKey, contents: ShopContent[]) {
    super();

    this.scale = 0.75;
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
    this.image.scale = this.scale / config.resolutionScale;

    const padding = 50 / config.resolutionScale;
    const step = (config.editorWidth - 2 * padding) / (ITEMS_PER_ROW - 1);

    if (onBuy) {
      this.contents.forEach((content, index) => {
        content.create(
          add,
          step * (index % ITEMS_PER_ROW) + padding,
          height + step * Math.floor(index / ITEMS_PER_ROW) + padding,
          onBuy
        );
      });
    }
  }
}
