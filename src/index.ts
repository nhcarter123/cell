import Phaser from "phaser";
import config from "./config";
import Ocean from "./scenes/ocean";
import Editor from "./scenes/editor";
import EditorGUI from "./scenes/editorGUI";

export enum ESceneKey {
  Ocean='Ocean',
  Editor='Editor',
  EditorGUI='EditorGUI',
}

// globals
export const EDITOR_WIDTH = 400


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
    scene: [Editor, EditorGUI],
    // scene: [Ocean],
  })
);

game.scene.start(ESceneKey.EditorGUI)