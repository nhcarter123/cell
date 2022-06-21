import GameScene, { RADIUS, SPACING } from "./gameScene";
import { Organism } from "../objects/organism";
import { BrainCell } from "../objects/cells/brainCell";
import { EDITOR_WIDTH, ESceneKey } from "../index";
import { lerp } from "../helpers/math";
import { Vector } from "matter";

const availableSpotColor = Phaser.Display.Color.ValueToColor("#dedede").color;

export default class Editor extends GameScene {
  private organism: Organism;
  private zoom: number;
  private availableSpots: Vector[];
  private availableSpotGraphics?: Phaser.GameObjects.Graphics;

  constructor() {
    super({
      key: ESceneKey.Editor,
      physics: {
        default: "matter",
        matter: {
          // enableSleeping: true,
          gravity: {
            y: 0,
          },
          debug: {
            // showJoint: false,
            showBody: false,
          },
        },
      },
    });

    this.zoom = 1;
    const cells = [new BrainCell(0, 0)];

    this.organism = new Organism(true, 0, 0, cells);

    this.availableSpots = this.organism.getAvailableSpots();
  }

  create() {
    this.organism.create(this.add, this.matter);

    this.availableSpotGraphics = this.add.graphics();

    // setup camera
    if (this.organism?.brain?.image) {
      this.cameras.main.fadeIn(1000);
      this.cameras.main.setPosition(EDITOR_WIDTH / 2, 0);

      this.cameras.main.startFollow(
        this.organism.brain.image,
        false,
        0.01,
        0.01
      );
    }

    this.drawAvailableSpots();
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    this.zoom = lerp(this.zoom, 1.6, 0.02);
    this.cameras.main.setZoom(this.zoom);
    // const currentTab = this.tabs.find((tab) => tab.id === this.currentTab);
    // if (currentTab) {
    //   currentTab.background.fillColor = hoveredTabColor;
    // }

    this.setCameraPosition();
  }

  setCameraPosition() {
    // this.cameras.main.setFollowOffset(-100, 100);
    // this.cameras.main.se;
  }

  drawAvailableSpots() {
    if (this.availableSpotGraphics) {
      this.availableSpotGraphics.clear();
      this.availableSpotGraphics.fillStyle(availableSpotColor, 0.2);

      this.availableSpots.forEach((spot) => {
        this.availableSpotGraphics?.fillCircle(
          spot.x * SPACING,
          spot.y * SPACING,
          RADIUS
        );
      });
    }
  }
}
