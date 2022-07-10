import Phaser from "phaser";
import OutlinePipelinePlugin from "phaser3-rex-plugins/plugins/outlinepipeline-plugin";
import { IBodyDefinition } from "matter";

type TPhysicsDefaults = Pick<
  IBodyDefinition,
  "restitution" | "frictionStatic" | "frictionAir" | "isStatic"
>;

// globals
export const MIN_WIDTH = 1280;
export const MIN_HEIGHT = 720;
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
  // isStatic: true,
};

const BASE_SCALE = 1;

class Config {
  public screenWidth: number;
  public screenHeight: number;
  public startingScreenWidth: number;
  public startingScreenHeight: number;
  public editorWidth: number;
  public scale: number;
  public resolutionScale: number;

  constructor() {
    this.screenWidth = 0;
    this.screenHeight = 0;
    this.editorWidth = 0;
    this.scale = 0;
    this.resolutionScale = 1;
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

    // const minSize = Math.min(window.innerWidth, window.innerHeight);

    const widthDiff = (MIN_WIDTH - window.innerWidth) / MIN_WIDTH;
    const heightDiff = (MIN_HEIGHT - window.innerHeight) / MIN_HEIGHT;

    if (widthDiff > 0 || heightDiff > 0) {
      if (widthDiff > heightDiff) {
        this.scale =
          (BASE_SCALE - (MIN_WIDTH - window.innerWidth) / MIN_WIDTH) *
          this.resolutionScale;
      } else {
        this.scale =
          (BASE_SCALE - (MIN_HEIGHT - window.innerHeight) / MIN_HEIGHT) *
          this.resolutionScale;
      }
    } else {
      this.scale = BASE_SCALE * this.resolutionScale;
    }

    // console.log(this.scale);

    //
    //
    // if (window.innerWidth < MIN_WIDTH) {
    //   this.scale = BASE_SCALE - (800 - minSize) / 800;
    // } else {
    //   this.scale = BASE_SCALE;
    // }

    this.screenWidth = window.innerWidth / this.scale;
    this.screenHeight = window.innerHeight / this.scale;
    this.editorWidth = 400 / this.resolutionScale;

    if (this.startingScreenWidth === 0) {
      this.startingScreenWidth = this.screenWidth;
      this.startingScreenHeight = this.screenHeight;
    }

    console.log(this.screenWidth);
    console.log(this.screenHeight);
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
        // autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
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
