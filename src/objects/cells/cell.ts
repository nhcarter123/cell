import { compact } from "lodash";
import { Organism } from "../organism";
import { HealthBar } from "../healthbar";
import {
  EImageKey,
  RAD_3_OVER_2,
  RADIUS,
  SPACING,
} from "../../scenes/gameScene";
import { Vector } from "matter";
import { floatEquals } from "../../helpers/math";
import DegToRad = Phaser.Math.DegToRad;

type TCellOverrides = Partial<
  Pick<
    Cell,
    | "health"
    | "offsetX"
    | "offsetY"
    | "mass"
    | "color"
    | "imageKey"
    | "isBody"
    | "angleOffset"
  >
>;

interface ICellAndAngle {
  cell: Cell;
  angle: number;
}

interface ICellLink {
  cell: Cell;
  link: MatterJS.ConstraintType;
}

interface ISpotAndOffset {
  pos: Vector;
  offset: number;
}

export class Cell {
  public organism?: Organism;
  public obj?: MatterJS.BodyType;
  public image?: Phaser.GameObjects.Image;
  public healthBar?: HealthBar;
  public upLeftCell?: Cell;
  public upRightCell?: Cell;
  public leftCell?: Cell;
  public rightCell?: Cell;
  public downLeftCell?: Cell;
  public downRightCell?: Cell;
  // public upLeftLink?: MatterJS.ConstraintType;
  // public upRightLink?: MatterJS.ConstraintType;
  // public leftLink?: MatterJS.ConstraintType;
  public links: ICellLink[];

  public offsetX: number;
  public offsetY: number;

  public readonly mass: number;
  public readonly color: number;
  public readonly isBody: boolean;
  public angleOffset: number;

  public health: number;
  public maxHealth: number;
  public previousHealth: number;
  public showHealthBar: number;

  public connected: boolean;
  public beenScanned: boolean;
  public imageKey: EImageKey;

  constructor(overrides: TCellOverrides) {
    this.offsetX = overrides.offsetX !== undefined ? overrides.offsetX : 0;
    this.offsetY = overrides.offsetY !== undefined ? overrides.offsetY : 0;
    this.color = overrides.color !== undefined ? overrides.color : 0xffffff;
    this.isBody = overrides.isBody !== undefined ? overrides.isBody : true;
    this.mass = overrides.mass !== undefined ? overrides.mass : 1;
    this.angleOffset =
      overrides.angleOffset !== undefined ? overrides.angleOffset : 0;
    this.imageKey =
      overrides.imageKey !== undefined ? overrides.imageKey : EImageKey.FatCell;
    this.health = overrides.health !== undefined ? overrides.health : 1;
    this.maxHealth = this.maxHealth = this.health; // potentially add this as an override

    this.previousHealth = this.health;
    this.showHealthBar = 0;

    this.connected = false;
    this.beenScanned = false;

    this.links = [];
  }

  create(
    org: Organism,
    add: Phaser.GameObjects.GameObjectFactory,
    matter?: Phaser.Physics.Matter.MatterPhysics
  ) {
    this.organism = org;

    if (matter) {
      this.obj = matter.add.circle(
        this.organism.avgPosition.x + this.offsetX * SPACING,
        this.organism.avgPosition.y + this.offsetY * SPACING,
        RADIUS,
        {
          restitution: 0,
          mass: this.mass,
          // isStatic: true,
        }
      );
    }

    this.image = add.image(
      this.offsetX * SPACING,
      this.offsetY * SPACING,
      this.imageKey
    );
    this.image.scale = 0.65;
    this.image.rotation = DegToRad(this.angleOffset);

    this.healthBar = new HealthBar(add);

    this.setChildrenCells();
  }

  getSurroundingCells(): Cell[] {
    return compact([
      this.upLeftCell,
      this.upRightCell,
      this.rightCell,
      this.downRightCell,
      this.downLeftCell,
      this.leftCell,
    ]);
  }

  getSurroundingAvailableSpots(): ISpotAndOffset[] {
    if (!this.isBody) {
      return [];
    }

    return compact([
      !this.upLeftCell && {
        offset: 330,
        pos: {
          x: this.offsetX - 0.5,
          y: this.offsetY - RAD_3_OVER_2,
        },
      },
      !this.upRightCell && {
        offset: 30,
        pos: {
          x: this.offsetX + 0.5,
          y: this.offsetY - RAD_3_OVER_2,
        },
      },
      !this.rightCell && {
        offset: 90,
        pos: {
          x: this.offsetX + 1,
          y: this.offsetY,
        },
      },
      !this.downRightCell && {
        offset: 150,
        pos: {
          x: this.offsetX + 0.5,
          y: this.offsetY + RAD_3_OVER_2,
        },
      },
      !this.downLeftCell && {
        offset: 210,
        pos: {
          x: this.offsetX - 0.5,
          y: this.offsetY + RAD_3_OVER_2,
        },
      },
      !this.leftCell && {
        offset: 270,
        pos: {
          x: this.offsetX - 1,
          y: this.offsetY,
        },
      },
    ]);
  }

  isDangly(cell: Cell): boolean {
    return !compact([
      this.rightCell &&
        this.downRightCell &&
        (cell === this.rightCell || cell === this.downRightCell),
      this.downRightCell &&
        this.downLeftCell &&
        (cell === this.downRightCell || cell === this.downLeftCell),
      this.downLeftCell &&
        this.leftCell &&
        (cell === this.downLeftCell || cell === this.leftCell),
      this.leftCell &&
        this.upLeftCell &&
        (cell === this.leftCell || cell === this.upLeftCell),
      this.upLeftCell &&
        this.upRightCell &&
        (cell === this.upLeftCell || cell === this.upRightCell),
      this.upRightCell &&
        this.rightCell &&
        (cell === this.upRightCell || cell === this.rightCell),
    ]).length;
  }

  getLinkableCells(): Cell[] {
    return compact([this.rightCell, this.downRightCell, this.downLeftCell]);
  }

  getFirstNeighborCell(): ICellAndAngle | undefined {
    if (this.upLeftCell) {
      return {
        cell: this.upLeftCell,
        angle: 240,
      };
    }

    if (this.upRightCell) {
      return {
        cell: this.upRightCell,
        angle: 300,
      };
    }

    if (this.rightCell) {
      return {
        cell: this.rightCell,
        angle: 0,
      };
    }

    if (this.downRightCell) {
      return {
        cell: this.downRightCell,
        angle: 60,
      };
    }

    if (this.downLeftCell) {
      return {
        cell: this.downLeftCell,
        angle: 120,
      };
    }

    if (this.leftCell) {
      return {
        cell: this.leftCell,
        angle: 180,
      };
    }
  }

  update(matter: Phaser.Physics.Matter.MatterPhysics, attacking: boolean) {
    if (!this.connected) {
      this.health -= 0.0025;
    }

    if (this.image) {
      this.image.x = this.obj?.position.x || 0;
      this.image.y = this.obj?.position.y || 0;
    }

    // show health bar when life changes
    if (this.health !== this.previousHealth) {
      this.showHealthBar = 600;
    }

    if (this.showHealthBar > 0) {
      this.showHealthBar -= 1;

      if (this.healthBar && this.obj) {
        this.healthBar.draw(
          this.obj.position.x,
          this.obj.position.y,
          this.health,
          this.maxHealth,
          this.showHealthBar / 90
        );
      }
    }

    if (this.health <= 0 && this.previousHealth > 0) {
      this.organism?.syncCells(matter);
    }

    this.previousHealth = this.health;
  }

  destroy(matter: Phaser.Physics.Matter.MatterPhysics) {
    if (this.obj) {
      matter.world.remove(this.obj);
    }
    this.image?.destroy();
    this.healthBar?.destroy();
  }

  setChildrenCells() {
    this.upLeftCell = this.organism?.cells.find(
      (c) =>
        this.offsetX - 0.5 === c.offsetX &&
        floatEquals(this.offsetY - RAD_3_OVER_2, c.offsetY) &&
        c.health > 0
    );
    this.upRightCell = this.organism?.cells.find(
      (c) =>
        this.offsetX + 0.5 === c.offsetX &&
        floatEquals(this.offsetY - RAD_3_OVER_2, c.offsetY) &&
        c.health > 0
    );
    this.leftCell = this.organism?.cells.find(
      (c) =>
        this.offsetX - 1 === c.offsetX &&
        floatEquals(this.offsetY, c.offsetY) &&
        c.health > 0
    );
    this.rightCell = this.organism?.cells.find(
      (c) =>
        this.offsetX + 1 === c.offsetX &&
        floatEquals(this.offsetY, c.offsetY) &&
        c.health > 0
    );
    this.downLeftCell = this.organism?.cells.find(
      (c) =>
        this.offsetX - 0.5 === c.offsetX &&
        floatEquals(this.offsetY + RAD_3_OVER_2, c.offsetY) &&
        c.health > 0
    );
    this.downRightCell = this.organism?.cells.find(
      (c) =>
        this.offsetX + 0.5 === c.offsetX &&
        floatEquals(this.offsetY + RAD_3_OVER_2, c.offsetY) &&
        c.health > 0
    );
  }
}
