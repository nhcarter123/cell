import GameScene, { RADIUS, SPACING } from "./gameScene";
import { IAvailableSpot, Organism } from "../objects/organism";
import { EDITOR_WIDTH, ESceneKey } from "../index";
import { lerp, pointDist } from "../helpers/math";
import { Vector } from "matter";
import eventsCenter, { EEvent } from "../events/eventCenter";
import { screenHeight, screenWidth } from "../config";
import DegToRad = Phaser.Math.DegToRad;
import editorState from "../context/editorState";
import {
  createCellFromType,
  loadOrganism,
  saveData,
  saveOrganism,
} from "../context/saveData";

const availableSpotColor = Phaser.Display.Color.ValueToColor("#dedede").color;

export default class Editor extends GameScene {
  private organism: Organism;
  private zoom: number;
  private targetZoom: number;
  private availableSpots: IAvailableSpot[];
  private availableSpotGraphics?: Phaser.GameObjects.Graphics;
  private offset: Vector;
  private scrollX: number;
  private scrollY: number;
  private targetScrollX: number;
  private targetScrollY: number;
  private heldCellDuration: number;

  constructor() {
    super(ESceneKey.Editor);

    this.zoom = 1;
    this.targetZoom = this.zoom;

    this.organism = loadOrganism(saveData.organism);
    this.offset = { x: 0, y: 0 };

    this.availableSpots = [];

    this.scrollX = 0;
    this.scrollY = 0;
    this.targetScrollX = 0;
    this.targetScrollY = 0;
    this.heldCellDuration = 0;
  }

  create() {
    this.organism.create(this.add);

    this.availableSpotGraphics = this.add.graphics();

    // setup camera
    this.cameras.main.fadeIn(1000);
    this.setCamera();

    eventsCenter.on(EEvent.BuyCell, () => {
      this.heldCellDuration = 0;
      this.addBuyingCell();
    });
    eventsCenter.on(EEvent.Continue, () => {
      saveData.organism = saveOrganism(this.organism);

      this.scene.sleep(ESceneKey.EditorGUI);
      this.scene.switch(ESceneKey.Ocean);
    });

    this.input.on("wheel", (_1: any, _2: any, _3: any, deltaY: number) => {
      this.targetZoom += deltaY / 150;
    });

    const rKey = this.input.keyboard.addKey("R");

    rKey.on("down", () => {
      editorState.rotationIndex += 1;
    });

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      eventsCenter.off(EEvent.BuyCell);
      eventsCenter.off(EEvent.Continue);
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

    let clicked = false;
    if (this.input.mousePointer.leftButtonDown()) {
      if (!this.leftButtonPressed) {
        this.leftButtonPressed = true;
        clicked = true;
      }
    }

    if (editorState.mouseCell?.image) {
      this.heldCellDuration += 1;
      const inEditor = this.input.mousePointer.x < EDITOR_WIDTH;

      if (clicked && inEditor && this.heldCellDuration > 60) {
        this.sellCell();
      } else {
        const hoveredSpot = this.getHoveredSpot();
        const mousePos = this.getMousePos();

        if (hoveredSpot) {
          editorState.mouseCell.image.x = hoveredSpot.pos.x * SPACING;
          editorState.mouseCell.image.y = hoveredSpot.pos.y * SPACING;
          editorState.mouseCell.angleOffset =
            hoveredSpot.availableOffsets[
              editorState.rotationIndex % hoveredSpot.availableOffsets.length
            ];
          editorState.mouseCell.image.alpha = 1;
          editorState.mouseCell.image.rotation = DegToRad(
            editorState.mouseCell.angleOffset
          );

          if (clicked) {
            editorState.mouseCell.offsetX = hoveredSpot.pos.x;
            editorState.mouseCell.offsetY = hoveredSpot.pos.y;
            this.organism.cells.push(editorState.mouseCell);
            this.organism.syncCells();
            this.setCamera();
            this.addBuyingCell();
          }
        } else {
          editorState.mouseCell.image.x = mousePos.x;
          editorState.mouseCell.image.y = mousePos.y;
          editorState.mouseCell.image.alpha = 0.5;
        }
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

  getHoveredSpot(): IAvailableSpot | undefined {
    if (editorState.mouseCell?.image) {
      const mousePos = this.getMousePos();

      for (const spot of this.availableSpots) {
        const dist = pointDist(
          spot.pos.x * SPACING,
          spot.pos.y * SPACING,
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
          spot.pos.x * SPACING,
          spot.pos.y * SPACING,
          RADIUS
        );
      });
    }
  }

  addBuyingCell() {
    const offset = this.getMousePos();
    const cell = createCellFromType(editorState.type, {
      offsetX: offset.x / SPACING,
      offsetY: offset.y / SPACING,
    });
    cell.create(this.organism, this.add);
    editorState.mouseCell = cell;

    this.availableSpots = this.organism.getAvailableSpots();
    this.drawAvailableSpots();
  }

  sellCell() {
    if (editorState.mouseCell?.image) {
      editorState.mouseCell.image.destroy();
      editorState.mouseCell = undefined;
      this.availableSpots = [];
      this.drawAvailableSpots();
    }
  }
}
