import Phaser from "phaser";
import config from "./config";
import Ocean from "./scenes/ocean";
import Load from "./scenes/load";
import EditorGUI from "./scenes/editor/editorGUI";
import Editor from "./scenes/editor/editor";
import EditorBackground from "./scenes/editor/editorBackground";

export enum ESceneKey {
  Ocean = "Ocean",
  Editor = "Editor",
  EditorGUI = "EditorGUI",
  EditorBackground = "EditorBackground",
  Load = "Load",
}

const loadFont = (name: string) => {
  const newFont = new FontFace(name, `url("assets/fonts/${name}.ttf")`);
  newFont.load().then(function (loaded) {
    document.fonts.add(loaded);
  });
};

loadFont("concert_one");
loadFont("bangers");

new Phaser.Game(
  Object.assign(config, {
    scene: [Load, EditorBackground, EditorGUI, Editor, Ocean],
  })
);
