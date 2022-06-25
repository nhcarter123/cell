import Phaser from "phaser";
import Editor from "./scenes/editor";
import EditorGUI from "./scenes/editorGUI";
import config from "./config";
import Ocean from "./scenes/ocean";

// globals
export const EDITOR_WIDTH = 400;

export enum ESceneKey {
  Ocean = "Ocean",
  Editor = "Editor",
  EditorGUI = "EditorGUI",
}

const loadFont = (name: string) => {
  const newFont = new FontFace(name, `url("assets/fonts/${name}.ttf")`);
  newFont.load().then(function (loaded) {
    document.fonts.add(loaded);
  });
};

loadFont("concert_one");
loadFont("bangers");

const game = new Phaser.Game(
  Object.assign(config, {
    scene: [EditorGUI, Editor, Ocean],
  })
);

game.scene.start(ESceneKey.Editor);
