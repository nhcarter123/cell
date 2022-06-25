import GameScene from "./gameScene";
import { screenHeight, screenWidth } from "../config";
import { EDITOR_WIDTH, ESceneKey } from "../index";
import {
  DEFAULT_TAB_COLOR,
  HOVERED_TAB_COLOR,
  SELECTED_TAB_COLOR,
  Tab,
} from "../objects/editor/tab/tab";
import { MouthTab } from "../objects/editor/tab/mouthTab";
import { DefenseTab } from "../objects/editor/tab/defenseTab";
import { BodyTab } from "../objects/editor/tab/bodyTab";
import eventsCenter, { ECellType, EEvent } from "../events/eventCenter";
import { Button } from "../objects/editor/tab/button";
import editorState from "../context/editorState";

const TAB_HEIGHT = 80;

export default class EditorGUI extends GameScene {
  private panel?: Phaser.GameObjects.Rectangle;
  private tabIndex: number;
  private continueButton: Button;
  private tabs: Tab[];

  constructor() {
    super(ESceneKey.EditorGUI);

    this.tabIndex = 0;
    this.tabs = [new BodyTab(), new MouthTab(), new DefenseTab()];
    this.continueButton = new Button();
  }

  create() {
    const continueButtonWidth = 140;
    const continueButtonHeight = 60;

    this.continueButton.create(
      this.add,
      screenWidth - continueButtonWidth / 2,
      screenHeight - continueButtonHeight / 2,
      continueButtonWidth,
      continueButtonHeight,
      () => eventsCenter.emit(EEvent.Continue)
    );

    this.panel = this.add.rectangle(
      EDITOR_WIDTH / 2,
      screenHeight / 2,
      EDITOR_WIDTH,
      screenHeight,
      Phaser.Display.Color.ValueToColor("#484848").color
    );
    this.panel.alpha = 0.75;

    this.tabs.forEach((tab, index) => {
      const tabWidth = EDITOR_WIDTH / this.tabs.length;

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
        TAB_HEIGHT / 2,
        tabWidth,
        TAB_HEIGHT,
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

    // const currentTab = this.tabs.find((tab) => tab.id === this.currentTab);
    // if (currentTab) {
    //   currentTab.background.fillColor = hoveredTabColor;
    // }

    // if ()
  }

  buyItem(cost: number, type: ECellType) {
    if (!editorState.mouseCell) {
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
