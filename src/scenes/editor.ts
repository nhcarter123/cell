import GameScene, { RADIUS, SPACING } from "./gameScene";
import { IAvailableSpot, Organism } from "../objects/organism";
import { EDITOR_WIDTH, ESceneKey } from "../index";
import { angleDiff, lerp, pointDir, pointDist } from "../helpers/math";
import { Vector } from "matter";
import eventsCenter, { EEvent } from "../events/eventCenter";
import { screenHeight, screenWidth } from "../config";
import editorState from "../context/editorState";
import {
  createCellFromType,
  loadOrganism,
  saveData,
  saveOrganism,
} from "../context/saveData";
import { Cell } from "../objects/cells/cell";
import OutlinePipelinePlugin from "phaser3-rex-plugins/plugins/outlinepipeline-plugin";
import { compact } from "lodash";

const originColor = Phaser.Display.Color.ValueToColor("#414141").color;
const availableSpotColor = Phaser.Display.Color.ValueToColor("#dedede").color;
const hoveredCellColor = Phaser.Display.Color.ValueToColor("#e0e0e0").color;

export default class Editor extends GameScene {
  private organism: Organism;
  private zoom: number;
  private targetZoom: number;
  private availableSpots: IAvailableSpot[];
  private availableSpotGraphics?: Phaser.GameObjects.Graphics;
  private origin?: Phaser.GameObjects.Graphics;
  private hoveredCell?: Cell;
  private highlightedCells: Cell[];
  private offset: Vector;
  private scrollX: number;
  private scrollY: number;
  private targetScrollX: number;
  private targetScrollY: number;
  private heldCellDuration: number;
  private pipelineInstance?: OutlinePipelinePlugin;

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
    this.highlightedCells = [];
  }

  create() {
    this.pipelineInstance = this.plugins.get(
      "rexOutlinePipeline"
    ) as OutlinePipelinePlugin;

    this.organism.create(this.add);

    this.availableSpotGraphics = this.add.graphics();
    this.availableSpotGraphics.depth = 10;

    const short = 1;
    const long = 10000;
    this.origin = this.add.graphics();
    this.origin.fillStyle(originColor, 0.1);
    this.origin.fillRect(-short / 2, -long / 2, short, long);
    this.origin.fillRect(-long / 2, -short / 2, long, short);
    this.origin.depth = -10;

    // setup camera
    this.cameras.main.fadeIn(1000);
    this.setCamera();

    eventsCenter.on(EEvent.BuyCell, () => {
      this.heldCellDuration = 0;
      this.addBuyingCell({ x: 0, y: 0 });
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
      // editorState.rotateMouseCells();
      // this.availableSpots = this.getAvailableSpots();
      // this.drawAvailableSpots();
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

    this.organism.cells.forEach((cell) => cell.update(false));
    editorState.mouseCells.forEach((cell) => cell.update(false));

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

    const mousePos = this.getMousePos();

    if (editorState.mouseCells.length) {
      this.heldCellDuration += 1;
      const inEditor = this.input.mousePointer.x < EDITOR_WIDTH;

      if (clicked && inEditor && this.heldCellDuration > 60) {
        this.sellCell();
      } else {
        const hoveredSpot = this.getHoveredSpot(mousePos.x, mousePos.y);

        if (hoveredSpot) {
          let smallestDiff = 180;

          for (const offset of hoveredSpot.availableOffsets) {
            const dir = pointDir(
              hoveredSpot.pos.x * SPACING,
              hoveredSpot.pos.y * SPACING,
              mousePos.x,
              mousePos.y
            );
            const diff = Math.abs(angleDiff(offset, dir - 60));

            if (diff < smallestDiff) {
              smallestDiff = diff;
              editorState.angle = offset;
            }
          }

          editorState.setMouseCellsPosition(
            hoveredSpot.pos.x * SPACING,
            hoveredSpot.pos.y * SPACING,
            1
          );

          if (clicked) {
            editorState.setMouseCellsOffset(hoveredSpot.pos, true);

            this.organism.addCells(editorState.mouseCells);

            this.setCamera();
            // this.addBuyingCell();
            this.availableSpots = [];
            this.drawAvailableSpots();
            editorState.mouseCells = [];
          }
        } else {
          editorState.setMouseCellsPosition(mousePos.x, mousePos.y, 0.5);
        }
      }
    } else {
      const hoveredCell = this.getHoveredCell(mousePos.x, mousePos.y);

      if (hoveredCell !== this.hoveredCell) {
        if (hoveredCell) {
          this.organism.setConnected(hoveredCell);

          this.highlightCells(
            compact(
              this.organism.cells
                .filter((cell) => !cell.connected)
                .sort((a) => (a === hoveredCell ? -1 : 1))
            )
          );
        } else {
          this.clearHighlight();
        }
      }

      this.hoveredCell = hoveredCell;

      if (this.hoveredCell?.image && clicked) {
        this.organism.removeCells(this.highlightedCells);
        editorState.mouseCells = this.highlightedCells;

        editorState.setMouseCellsOffset(this.hoveredCell.offset, false);

        this.availableSpots = this.getAvailableSpots();
        this.drawAvailableSpots();
        this.clearHighlight();
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

  getHoveredSpot(x: number, y: number): IAvailableSpot | undefined {
    for (const spot of this.availableSpots) {
      const dist = pointDist(spot.pos.x * SPACING, spot.pos.y * SPACING, x, y);

      if (dist < RADIUS) {
        return spot;
      }
    }
  }

  getHoveredCell(x: number, y: number): Cell | undefined {
    for (const cell of this.organism.cells) {
      const dist = pointDist(
        cell.offset.x * SPACING,
        cell.offset.y * SPACING,
        x,
        y
      );

      if (dist < RADIUS) {
        return cell;
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

  addBuyingCell(offset: Vector) {
    const cell = createCellFromType(editorState.type, {
      offset,
    });
    cell.create(this.organism, this.add);
    editorState.mouseCells = [cell];

    this.availableSpots = this.getAvailableSpots();
    this.drawAvailableSpots();
  }

  sellCell() {
    editorState.mouseCells.forEach((cell) => {
      cell.image?.destroy();
    });
    editorState.mouseCells = [];
    this.availableSpots = [];
    this.drawAvailableSpots();
  }

  highlightCells(cells: Cell[]) {
    this.clearHighlight();
    this.highlightedCells = cells;
    this.highlightedCells.forEach(
      (cell) =>
        cell.image &&
        this.pipelineInstance?.add(cell.image, {
          // @ts-ignore the typing is just broken on this
          thickness: 6,
          outlineColor: hoveredCellColor,
        })
    );
  }

  clearHighlight() {
    this.highlightedCells.forEach(
      (cell) => cell.image && this.pipelineInstance?.remove(cell.image)
    );
    this.highlightedCells = [];
  }

  getAvailableSpots(): IAvailableSpot[] {
    // const requiredAngle =
    //   editorState.mouseCells.length === 1 &&
    //   editorState.mouseCells[0] &&
    //   editorState.mouseCells[0].mustPlacePerpendicular
    //     ? editorState.mouseCells[0].angleOffset
    //     : undefined;

    return this.organism.getAvailableSpots(editorState.mouseCells);
  }
}
