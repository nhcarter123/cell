import Phaser from "phaser";
import OutlinePipelinePlugin from "phaser3-rex-plugins/plugins/outlinepipeline-plugin";
import { IBodyDefinition } from "matter";

type TPhysicsDefaults = Pick<
  IBodyDefinition,
  "restitution" | "frictionStatic" | "frictionAir" | "isStatic"
>;

// globals
export const SCREEN_WIDTH = 1600;
export const SCREEN_HEIGHT = 900;
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

export default {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#33A5E7",
  scale: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
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
