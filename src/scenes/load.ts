import { ESceneKey } from "../index";

export enum EImageKey {
  Arrow = "Arrow",
  FatCell = "FatCell",
  CiliaCell = "CiliaCell",
  BrainCell = "BrainCell",
  MouthCell = "MouthCell",
  SpikeCell = "SpikeCell",
  BoneCell = "BoneCell",
}

export const IMAGE_FOLDER = "assets/images";

export default class Load extends Phaser.Scene {
  constructor() {
    super(ESceneKey.Load);
  }

  preload() {
    this.load.glsl("bundle", "assets/shaders/bundle.glsl.js");

    Object.values(EImageKey).forEach((key) =>
      this.load.image(key, `${IMAGE_FOLDER}/${key}.png`)
    );
  }

  create() {
    this.scene.launch(ESceneKey.Editor);
    this.scene.launch(ESceneKey.EditorGUI);
    this.scene.launch(ESceneKey.EditorBackground);
    this.scene.stop(ESceneKey.Load);
  }
}
