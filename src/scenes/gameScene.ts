// globals
export const RADIUS = 20;
export const PADDING = 20;
export const SPACING = RADIUS * 2 + PADDING;
export const STIFFNESS = 0.004;
export const DAMPING = 0.1;
export const MASS = 1;
export const RAD_3_OVER_2 = Math.sqrt(3) / 2;

export enum EImageKey {
  FatCell = "FatCell",
  BrainCell = "BrainCell",
  MouthCell = "MouthCell",
  SpikeCell = "SpikeCell",
}

export const IMAGE_FOLDER = "assets/images";

export default class GameScene extends Phaser.Scene {
  public leftButtonPressed: boolean;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);

    this.leftButtonPressed = false;
  }

  preload() {
    Object.values(EImageKey).forEach((key) =>
      this.load.image(key, `${IMAGE_FOLDER}/${key}.png`)
    );
  }
}
