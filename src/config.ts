import Phaser from "phaser";
import OutlinePipelinePlugin from "phaser3-rex-plugins/plugins/outlinepipeline-plugin";

export const screenWidth = 1600;
export const screenHeight = 900;

export default {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#33A5E7",
  scale: {
    width: screenWidth,
    height: screenHeight,
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
