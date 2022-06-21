import GameScene from "./gameScene";
import { screenHeight } from "../config";
import { EDITOR_WIDTH, ESceneKey } from "../index";
import {
  DEFAULT_TAB_COLOR,
  HOVERED_TAB_COLOR,
  SELECTED_TAB_COLOR,
  Tab,
} from "../objects/editor/tab/tab";
import { MouthTab } from "../objects/editor/tab/mouthTab";
import { DefenseTab } from "../objects/editor/tab/defenseTab";

const TAB_HEIGHT = 80;

export default class EditorGUI extends GameScene {
  private panel?: Phaser.GameObjects.Rectangle;
  private tabIndex: number;
  private tabs: Tab[];

  constructor() {
    super(ESceneKey.EditorGUI);

    this.tabIndex = 0;
    this.tabs = [new MouthTab(), new DefenseTab()];
  }

  create() {
    this.panel = this.add.rectangle(
      EDITOR_WIDTH / 2,
      screenHeight / 2,
      EDITOR_WIDTH,
      screenHeight,
      Phaser.Display.Color.ValueToColor("#484848").color
    );

    this.tabs.forEach((tab, index) => {
      const tabWidth = (EDITOR_WIDTH - 8) / this.tabs.length;

      tab.create(this.add, tabWidth, TAB_HEIGHT, index, this.buyItem);

      if (tab.background) {
        tab.background
          .on("pointerdown", () => this.selectTab(index))
          .on("pointerover", () => {
            if (index !== this.tabIndex) {
              tab.background && (tab.background.fillColor = HOVERED_TAB_COLOR);
            }
          })
          .on("pointerout", () => {
            if (index !== this.tabIndex) {
              tab.background && (tab.background.fillColor = DEFAULT_TAB_COLOR);
            }
          });
      }
    });

    this.selectTab(this.tabIndex);
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    // const currentTab = this.tabs.find((tab) => tab.id === this.currentTab);
    // if (currentTab) {
    //   currentTab.background.fillColor = hoveredTabColor;
    // }
  }

  buyItem(cost: number) {
    console.log(cost);
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
