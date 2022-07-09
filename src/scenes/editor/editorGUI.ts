import {
  DEFAULT_TAB_COLOR,
  HOVERED_TAB_COLOR,
  SELECTED_TAB_COLOR,
  Tab,
} from "../../objects/editor/tab/tab";
import { MouthTab } from "../../objects/editor/tab/mouthTab";
import { DefenseTab } from "../../objects/editor/tab/defenseTab";
import { BodyTab } from "../../objects/editor/tab/bodyTab";
import eventsCenter, { ECellType, EEvent } from "../../events/eventCenter";
import { Button } from "../../objects/editor/tab/button";
import editorState from "../../context/editorState";
import { saveData, updateFacingDirection } from "../../context/saveData";
import { MovementTab } from "../../objects/editor/tab/movementTab";
import { EImageKey } from "../load";
import { ESceneKey } from "../../index";
import config from "../../config";

const TAB_HEIGHT = 80;
const CONTINUE_BUTTON_WIDTH = 200;
const CONTINUE_BUTTON_HEIGHT = 60;

export default class EditorGUI extends Phaser.Scene {
  private panel?: Phaser.GameObjects.Rectangle;
  private tabIndex: number;
  private continueButton: Button;
  private arrow?: Phaser.GameObjects.Image;
  private tabs: Tab[];

  constructor() {
    super(ESceneKey.EditorGUI);

    this.tabIndex = 0;
    this.tabs = [
      new BodyTab(),
      new MouthTab(),
      new MovementTab(),
      new DefenseTab(),
    ];
    this.continueButton = new Button();
  }

  create() {
    this.arrow = this.add
      .image(
        config.screenWidth - 75 / config.resolutionScale,
        80 / config.resolutionScale,
        EImageKey.Arrow
      )
      .setInteractive()
      // .on("pointerdown", updateFacingDirection)
      .on("pointerup", () => this.game.scale.startFullscreen());

    this.arrow.scale = 0.15 / config.resolutionScale;

    this.continueButton.create(
      this.add,
      0,
      0,
      CONTINUE_BUTTON_WIDTH,
      CONTINUE_BUTTON_HEIGHT,
      () => eventsCenter.emit(EEvent.Continue)
    );

    this.panel = this.add.rectangle(
      config.editorWidth / 2,
      config.screenHeight / 2,
      config.editorWidth,
      config.screenHeight,
      Phaser.Display.Color.ValueToColor("#484848").color
    );
    this.panel.alpha = 0.75;

    this.tabs.forEach((tab, index) => {
      const tabWidth = config.editorWidth / this.tabs.length;

      const onHover = () => {
        if (index !== this.tabIndex) {
          tab.background && (tab.background.fillColor = HOVERED_TAB_COLOR);
        }
      };

      const onExitHover = () => {
        if (index !== this.tabIndex) {
          tab.background && (tab.background.fillColor = DEFAULT_TAB_COLOR);
        }
      };

      tab.create(
        this.add,
        index * tabWidth + tabWidth / 2,
        TAB_HEIGHT / config.resolutionScale / 2,
        tabWidth,
        TAB_HEIGHT / config.resolutionScale,
        () => this.selectTab(index),
        onHover,
        onExitHover,
        this.buyItem.bind(this),
        index
      );
    });

    this.selectTab(this.tabIndex);
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    if (this.arrow) {
      this.arrow.angle = saveData.direction;
      this.arrow.x = config.screenWidth - 75 / config.resolutionScale;
      this.arrow.y = 80 / config.resolutionScale;
    }

    if (this.panel) {
      // this.panel.width = config.editorWidth;
      this.panel.y = config.screenHeight / 2;
      this.panel.displayHeight = config.screenHeight;
    }

    if (this.continueButton.background) {
      this.continueButton.background.scale = 1 / config.resolutionScale;
      this.continueButton.background.x =
        config.screenWidth - CONTINUE_BUTTON_WIDTH / 2 / config.resolutionScale;
      this.continueButton.background.y =
        config.screenHeight -
        CONTINUE_BUTTON_HEIGHT / 2 / config.resolutionScale;
    }

    // this.cameras.main.setZoom(1)

    // this.tabs.forEach((tab, index) => {
    //   const tabWidth = config.editorWidth / this.tabs.length;
    //
    //   if (tab.background) {
    //     // index * tabWidth + tabWidth / 2,
    //     //         TAB_HEIGHT / config.scale / 2,
    //     //         tabWidth,
    //     //         TAB_HEIGHT / config.scale,
    //
    //     tab.background.setSize(tabWidth, TAB_HEIGHT / config.scale);
    //     tab.background.x = index * tabWidth + tabWidth / 2;
    //     tab.background.y = TAB_HEIGHT / config.scale / 2;
    //   }
    //
    //   tab.contents.forEach((content) => {
    //     content.obj && (content.obj.scale = content.scale / config.scale);
    //   });
    // });

    // const currentTab = this.tabs.find((tab) => tab.id === this.currentTab);
    // if (currentTab) {
    //   currentTab.background.fillColor = hoveredTabColor;
    // }

    // if ()
  }

  buyItem(cost: number, type: ECellType) {
    if (!editorState.mouseCells.length) {
      editorState.type = type;
      eventsCenter.emit(EEvent.BuyCell);
    }
  }

  selectTab(selectedIndex: number) {
    this.tabIndex = selectedIndex;

    this.tabs.forEach((tab, index) => {
      if (index === this.tabIndex) {
        tab.background && (tab.background.fillColor = SELECTED_TAB_COLOR);
        tab.contents.forEach((content) => content.setVisible(true));
      } else {
        tab.background && (tab.background.fillColor = DEFAULT_TAB_COLOR);
        tab.contents.forEach((content) => content.setVisible(false));
      }
    });
  }
}
