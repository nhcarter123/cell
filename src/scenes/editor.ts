import GameScene, { EImageKey } from "./gameScene";
import { screenHeight } from "../config";

enum ETabId {
  Body = "Body",
  Mouth = "Mouth",
  Defense = "Defense",
}

enum EBodyCell {
  BodyCell = "BodyCell",
}

enum EMouthCell {
  MouthCell = "MouthCell",
}

enum EDefenseCell {
  BrainCell = "BrainCell",
}

type TShopCell = EBodyCell | EMouthCell | EDefenseCell;

interface IShopCell {
  type: TShopCell;
  tier: number;
  image?: Phaser.GameObjects.Image;
}

interface ITab {
  id: ETabId;
  image: Phaser.GameObjects.Image;
  background: Phaser.GameObjects.Rectangle;
  contents: IShopCell[];
}

const defaultTabColor = Phaser.Display.Color.ValueToColor("#727272").color;
const hoveredTabColor = Phaser.Display.Color.ValueToColor("#b1b1b1").color;
const selectedTabColor = Phaser.Display.Color.ValueToColor("#3e3e3e").color;

export default class Editor extends GameScene {
  private panel?: Phaser.GameObjects.Rectangle;
  private readonly panelWidth: number;
  private currentTabId: ETabId;
  private tabs: ITab[];

  constructor() {
    super("Editor");

    this.panelWidth = 400;

    this.tabs = [];
    this.currentTabId = ETabId.Body;
  }

  create() {
    this.panel = this.add.rectangle(
      this.panelWidth / 2,
      screenHeight / 2,
      this.panelWidth,
      screenHeight,
      Phaser.Display.Color.ValueToColor("#484848").color
    );

    const tabIds = Object.values(ETabId);
    this.tabs = tabIds.map((id, index) => {
      const tabHeight = 80;
      const tabWidth = this.panelWidth / tabIds.length;

      const background = this.add
        .rectangle(
          index * tabWidth + tabWidth / 2,
          tabHeight / 2,
          tabWidth,
          tabHeight,
          defaultTabColor
        )
        .setInteractive()
        .on("pointerdown", () => {
          this.selectTab(id);
        })
        .on("pointerover", () => {
          if (id !== this.currentTabId) {
            background.fillColor = hoveredTabColor;
          }
        })
        .on("pointerout", () => {
          if (id !== this.currentTabId) {
            background.fillColor = defaultTabColor;
          }
        });

      background.setStrokeStyle(
        8,
        Phaser.Display.Color.ValueToColor("#545454").color
      );

      const image = this.add.image(
        tabWidth / 2 + index * tabWidth,
        tabHeight / 2,
        this.getTabImage(id)
      );
      image.scale = 0.75;

      return {
        id: id,
        image,
        background,
        contents: this.getTabContents(id),
      };
    });

    this.selectTab(this.currentTabId);
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    // const currentTab = this.tabs.find((tab) => tab.id === this.currentTab);
    // if (currentTab) {
    //   currentTab.background.fillColor = hoveredTabColor;
    // }
  }

  getTabImage(id: ETabId): EImageKey {
    switch (id) {
      case ETabId.Body:
        return EImageKey.FatCell;
      case ETabId.Defense:
        return EImageKey.BrainCell;
      case ETabId.Mouth:
      default:
        return EImageKey.MouthCell;
    }
  }

  getTabContents(id: ETabId): IShopCell[] {
    switch (id) {
      case ETabId.Body:
        return Object.values(EBodyCell).map((type) => ({
          type,
          tier: 1,
        }));
      case ETabId.Defense:
        return [];
      case ETabId.Mouth:
      default:
        return [];
    }
  }

  selectTab(id: ETabId) {
    this.currentTabId = id;

    this.tabs.forEach((tab) => {
      if (this.currentTabId === tab.id) {
        tab.background.fillColor = selectedTabColor;

        console.log(tab.contents);
      } else {
        tab.background.fillColor = defaultTabColor;
      }
    });
  }
}
