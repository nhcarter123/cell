import { ESceneKey } from "../../index";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../../config";

export default class EditorBackground extends Phaser.Scene {
  private backgroundShader?: Phaser.GameObjects.Shader;

  constructor() {
    super(ESceneKey.EditorBackground);
  }

  create() {
    this.backgroundShader = this.add.shader(
      "ocean",
      0,
      0,
      SCREEN_WIDTH,
      SCREEN_HEIGHT
    );
    this.backgroundShader.scale = 2;
    // back.x = -200;
    this.backgroundShader.depth = -100;
  }
}
