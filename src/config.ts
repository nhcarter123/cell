import Phaser from "phaser";
import OutlinePipelinePlugin from "phaser3-rex-plugins/plugins/outlinepipeline-plugin";
import { IBodyDefinition } from "matter";

type TPhysicsDefaults = Pick<
  IBodyDefinition,
  "restitution" | "frictionStatic" | "frictionAir" | "isStatic"
>;

// globals
export const SCREEN_WIDTH = 400;
export const SCREEN_HEIGHT = 400;
export const EDITOR_WIDTH = 400;
export const RADIUS = 20;
export const PADDING = 4;
export const SPACING = RADIUS * 2 + PADDING;
export const STIFFNESS = 0.008;
export const DAMPING = 0.1;
export const MASS = 1;
export const RAD_3_OVER_2 = Math.sqrt(3) / 2;
export const PHYSICS_DEFAULTS: TPhysicsDefaults = {
  restitution: 0,
  frictionAir: 0.015,
  frictionStatic: 0,
  isStatic: false,
};

const BASE_SCALE = 1;

class Config {
  public screenWidth: number;
  public screenHeight: number;
  public startingScreenWidth: number;
  public startingScreenHeight: number;
  public editorWidth: number;
  public scale: number;

  constructor() {
    this.screenWidth = 0;
    this.screenHeight = 0;
    this.editorWidth = 0;
    this.scale = 0;
    this.startingScreenWidth = 0;
    this.startingScreenHeight = 0;
  }

  resize(game: Phaser.Game) {
    // if (
    //   window.innerWidth !== this.previousWidth ||
    //   window.innerHeight !== this.previousHeight
    // ) {
    // console.log(window.innerWidth);
    // console.log(this.previousWidth);
    // console.log(window.innerHeight);
    // console.log(this.previousHeight);
    //
    // this.previousWidth = window.innerWidth;
    // this.previousHeight = window.innerHeight;
    // const maxSize = Math.max(window.innerWidth, window.innerHeight);

    // if (maxSize < 1300) {
    //   this.scale = BASE_SCALE - (1300 - maxSize) / 1600;
    // } else {
    //   this.scale = BASE_SCALE;
    // }
    this.scale = BASE_SCALE;

    this.screenWidth = window.innerWidth / this.scale;
    this.screenHeight = window.innerHeight / this.scale;
    this.editorWidth = this.screenWidth / 4;

    if (this.startingScreenWidth === 0) {
      this.startingScreenWidth = this.screenWidth;
      this.startingScreenHeight = this.screenHeight;
    }

    game.scale.resize(this.screenWidth, this.screenHeight);
    // game.scale.setGameSize(window.innerWidth, window.innerHeight);
    game.scale.setZoom(this.scale);
    // }
  }

  getGameConfig(): Phaser.Types.Core.GameConfig {
    return {
      type: Phaser.AUTO,
      parent: "game",
      backgroundColor: "#33A5E7",
      scale: {
        mode: Phaser.Scale.ScaleModes.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: false,
        antialiasGL: false,
        roundPixels: false,
      },
      plugins: {
        global: [
          {
            key: "rexOutlinePipeline",
            plugin: OutlinePipelinePlugin,
            start: true,
          },
        ],
      },
    };
  }
}

const config = new Config();

export default config;
