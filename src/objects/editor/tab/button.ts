import config from "../../../config";
import { DEFAULT_TAB_COLOR, HOVERED_TAB_COLOR } from "./tab";

export const DEFAULT_BUTTON_COLOR =
  Phaser.Display.Color.ValueToColor("#727272").color;
export const DEFAULT_STROKE_COLOR =
  Phaser.Display.Color.ValueToColor("#545454").color;

export class Button {
  public background?: Phaser.GameObjects.Rectangle;

  constructor() {}

  create(
    add: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    width: number,
    height: number,
    onClick: Function,
    onHover?: Function,
    onExitHover?: Function
  ) {
    if (!onHover) {
      onHover = () =>
        this.background && (this.background.fillColor = HOVERED_TAB_COLOR);
    }
    if (!onExitHover) {
      onExitHover = () =>
        this.background && (this.background.fillColor = DEFAULT_TAB_COLOR);
    }

    this.background = add
      .rectangle(x, y, width, height, DEFAULT_BUTTON_COLOR)
      .setInteractive()
      .on("pointerdown", onClick)
      .on("pointerover", onHover)
      .on("pointerout", onExitHover)
      .setStrokeStyle(4 / config.resolutionScale, DEFAULT_STROKE_COLOR);
  }
}
