import GameScene, { RADIUS, SPACING } from "./gameScene";
import { Organism } from "../objects/organism";
import { BrainCell } from "../objects/cells/brainCell";
import { EDITOR_WIDTH, ESceneKey } from "../index";
import { lerp, pointDist } from "../helpers/math";
import { Vector } from "matter";
import { Cell } from "../objects/cells/cell";
import eventsCenter, { EBuyCell, EEvent } from "../events/eventCenter";
import { screenHeight, screenWidth } from "../config";
import { MouthCell } from "../objects/cells/mouthCell";

const availableSpotColor = Phaser.Display.Color.ValueToColor("#dedede").color;

export default class Editor extends GameScene {
  private organism: Organism;
  private zoom: number;
  private targetZoom: number;
  private availableSpots: Vector[];
  private availableSpotGraphics?: Phaser.GameObjects.Graphics;
  private mouseCell?: Cell;
  private offset: Vector;
  private buyingType: EBuyCell;
  private scrollX: number;
  private scrollY: number;
  private targetScrollX: number;
  private targetScrollY: number;

  constructor() {
    super(ESceneKey.Editor);

    this.zoom = 1;
    this.targetZoom = this.zoom;
    const cells = [new BrainCell(0, 0)];

    this.organism = new Organism(true, 0, 0, cells);
    this.offset = { x: 0, y: 0 };

    this.buyingType = EBuyCell.MouthCell;
    this.availableSpots = [];

    this.scrollX = 0;
    this.scrollY = 0;
    this.targetScrollX = 0;
    this.targetScrollY = 0;
  }

  create() {
    this.organism.create(this.add, this.matter);

    this.availableSpotGraphics = this.add.graphics();

    // setup camera
    this.cameras.main.fadeIn(1000);
    this.setCamera();

    eventsCenter.on(EEvent.BuyCell, (type: EBuyCell) => {
      this.buyingType = type;
      this.addBuyingCell();
    });

    this.input.on("wheel", (_1: any, _2: any, _3: any, deltaY: number) => {
      this.targetZoom += deltaY / 150;
    });
  }

  getMousePos(): Vector {
    return {
      x:
        (this.input.mousePointer.x - (screenWidth + EDITOR_WIDTH) / 2) /
          this.zoom +
        this.scrollX,
      y:
        (this.input.mousePointer.y - screenHeight / 2) / this.zoom +
        this.scrollY,
    };
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    this.zoom = lerp(this.zoom, this.targetZoom, 0.02);
    this.scrollX = lerp(this.scrollX, this.targetScrollX, 0.02);
    this.scrollY = lerp(this.scrollY, this.targetScrollY, 0.02);

    this.cameras.main.setZoom(this.zoom);
    this.cameras.main.setScroll(
      -(screenWidth + EDITOR_WIDTH / this.zoom) / 2 + this.scrollX,
      -screenHeight / 2 + this.scrollY
    );

    if (this.mouseCell?.image) {
      const hoveredSpot = this.getHoveredSpot();
      const mousePos = this.getMousePos();

      if (hoveredSpot) {
        this.mouseCell.image.x = hoveredSpot.x * SPACING;
        this.mouseCell.image.y = hoveredSpot.y * SPACING;

        if (this.input.mousePointer.leftButtonDown()) {
          if (!this.leftButtonPressed) {
            this.leftButtonPressed = true;
            this.mouseCell.offsetX = hoveredSpot.x;
            this.mouseCell.offsetY = hoveredSpot.y;
            this.organism.cells.push(this.mouseCell);
            this.organism.syncCells();
            this.setCamera();

            this.addBuyingCell();
          }
        }
      } else {
        this.mouseCell.image.x = mousePos.x;
        this.mouseCell.image.y = mousePos.y;
      }
    }

    if (this.input.mousePointer.leftButtonReleased()) {
      this.leftButtonPressed = false;
    }
  }

  setCamera() {
    this.offset = this.organism.getCenter();

    this.targetZoom = 3 / Math.pow(1 + this.organism.getMaxDiff() / 12, 1.3);
    this.targetScrollX = this.offset.x * SPACING;
    this.targetScrollY = this.offset.y * SPACING;
  }

  getHoveredSpot(): Vector | undefined {
    if (this.mouseCell?.image) {
      const mousePos = this.getMousePos();

      for (const spot of this.availableSpots) {
        const dist = pointDist(
          spot.x * SPACING,
          spot.y * SPACING,
          mousePos.x,
          mousePos.y
        );

        if (dist < RADIUS) {
          return spot;
        }
      }
    }
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

  getCellFromType(): Cell {
    const offset = this.getMousePos();

    switch (this.buyingType) {
      case EBuyCell.MouthCell:
        return new MouthCell(offset.x / SPACING, offset.y / SPACING);
    }
  }

  addBuyingCell() {
    const cell = this.getCellFromType();
    cell.create(this.organism, this.add);
    this.mouseCell = cell;

    this.availableSpots = this.organism.getAvailableSpots();
    this.drawAvailableSpots();
  }
}
