import { ESceneKey } from "../../index";
import config from "../../config";

export default class EditorBackground extends Phaser.Scene {
  private backgroundShader?: Phaser.GameObjects.Shader;

  constructor() {
    super(ESceneKey.EditorBackground);
  }

  create() {
    this.backgroundShader = this.add.shader(
      "ocean",
      config.startingScreenWidth / 2,
      config.startingScreenHeight / 2,
      config.screenWidth,
      config.screenHeight
    );
    this.backgroundShader.depth = -100;
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    if (this.backgroundShader) {
      this.backgroundShader.width = config.screenWidth;
      this.backgroundShader.height = config.screenHeight;
    }
  }
}
