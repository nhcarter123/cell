import Phaser from "phaser";
import config from "./config";
import Ocean from "./scenes/ocean";
import Editor from "./scenes/editor";

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
    scene: [Editor],
    // scene: [Ocean],
  })
);
