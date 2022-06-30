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
import RadToDeg = Phaser.Math.RadToDeg;

type TCellOverrides = Partial<
  Pick<
    Cell,
    | "health"
    | "offset"
    | "mass"
    | "color"
    | "imageKey"
    | "isBody"
    | "angleOffset"
    | "imageOffset"
    | "occupiedSpots"
    | "mustPlacePerpendicular"
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

export interface ISpotAndOffset {
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

  public offset: Vector;
  public placingOffset: Vector;

  public readonly mustPlacePerpendicular: boolean;
  public readonly mass: number;
  public readonly color: number;
  public readonly isBody: boolean;
  public readonly imageOffset: Vector;
  public angleOffset: number;

  public health: number;
  public maxHealth: number;
  public previousHealth: number;
  public showHealthBar: number;
  public occupiedSpots: Vector[];

  public connected: boolean;
  public beenScanned: boolean;
  public imageKey: EImageKey;

  constructor(overrides: TCellOverrides) {
    this.offset =
      overrides.offset !== undefined ? overrides.offset : { x: 0, y: 0 };
    this.color = overrides.color !== undefined ? overrides.color : 0xffffff;
    this.occupiedSpots =
      overrides.occupiedSpots !== undefined
        ? overrides.occupiedSpots
        : [{ x: 0, y: 0 }];
    this.isBody = overrides.isBody !== undefined ? overrides.isBody : true;
    this.mustPlacePerpendicular =
      overrides.mustPlacePerpendicular !== undefined
        ? overrides.mustPlacePerpendicular
        : false;
    this.mass = overrides.mass !== undefined ? overrides.mass : 1;
    this.imageOffset =
      overrides.imageOffset !== undefined
        ? overrides.imageOffset
        : { x: 0.5, y: 0.5 };
    this.angleOffset =
      overrides.angleOffset !== undefined ? overrides.angleOffset : 0;
    this.imageKey =
      overrides.imageKey !== undefined ? overrides.imageKey : EImageKey.FatCell;
    this.health = overrides.health !== undefined ? overrides.health : 1;
    this.maxHealth = this.maxHealth = this.health; // potentially add this as an override

    this.previousHealth = this.health;
    this.showHealthBar = 0;
    this.placingOffset = this.offset;

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
      this.createBody(matter, org);
    }

    this.image = add.image(
      this.offset.x * SPACING,
      this.offset.y * SPACING,
      this.imageKey
    );
    this.image.scale = 0.65;
    this.image.setOrigin(this.imageOffset.x, this.imageOffset.y);
    this.image.angle = this.angleOffset;

    this.healthBar = new HealthBar(add);

    this.setChildrenCells();
  }

  createBody(matter: Phaser.Physics.Matter.MatterPhysics, org: Organism) {
    // this.obj = matter.add.circle(
    //   org.avgPosition.x + this.offsetX * SPACING,
    //   org.avgPosition.y + this.offsetY * SPACING,
    //   RADIUS,
    //   {
    //     restitution: 0,
    //     mass: this.mass,
    //   }
    // );
    // this.obj = matter.add.polygon(
    //   org.avgPosition.x + this.offsetX * SPACING,
    //   org.avgPosition.y + this.offsetY * SPACING,
    //   6,
    //   RADIUS,
    //   {
    //     restitution: 0,
    //     mass: this.mass,
    //     // angle: DegToRad(90),
    //   }
    // );
    this.obj = matter.add.polygon(
      org.avgPosition.x + this.offset.x * SPACING,
      org.avgPosition.y + this.offset.y * SPACING,
      6,
      RADIUS,
      {
        restitution: 0,
        mass: this.mass,
        // isStatic: true,
        // angle: DegToRad(90),
      }
    );
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
          x: this.offset.x - 0.5,
          y: this.offset.y - RAD_3_OVER_2,
        },
      },
      !this.upRightCell && {
        offset: 30,
        pos: {
          x: this.offset.x + 0.5,
          y: this.offset.y - RAD_3_OVER_2,
        },
      },
      !this.rightCell && {
        offset: 90,
        pos: {
          x: this.offset.x + 1,
          y: this.offset.y,
        },
      },
      !this.downRightCell && {
        offset: 150,
        pos: {
          x: this.offset.x + 0.5,
          y: this.offset.y + RAD_3_OVER_2,
        },
      },
      !this.downLeftCell && {
        offset: 210,
        pos: {
          x: this.offset.x - 0.5,
          y: this.offset.y + RAD_3_OVER_2,
        },
      },
      !this.leftCell && {
        offset: 270,
        pos: {
          x: this.offset.x - 1,
          y: this.offset.y,
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

  update(attacking: boolean, matter?: Phaser.Physics.Matter.MatterPhysics) {
    if (!this.connected && matter) {
      this.health -= 0.0025;
    }

    if (this.image) {
      if (this.obj) {
        this.image.x = this.obj.position.x;
        this.image.y = this.obj.position.y;
        this.image.angle = RadToDeg(this.obj.angle);
      } else {
        this.image.angle = this.angleOffset;
      }
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
        floatEquals(this.offset.x - 0.5, c.offset.x) &&
        floatEquals(this.offset.y - RAD_3_OVER_2, c.offset.y) &&
        c.health > 0
    );
    this.upRightCell = this.organism?.cells.find(
      (c) =>
        floatEquals(this.offset.x + 0.5, c.offset.x) &&
        floatEquals(this.offset.y - RAD_3_OVER_2, c.offset.y) &&
        c.health > 0
    );
    this.leftCell = this.organism?.cells.find(
      (c) =>
        floatEquals(this.offset.x - 1, c.offset.x) &&
        floatEquals(this.offset.y, c.offset.y) &&
        c.health > 0
    );
    this.rightCell = this.organism?.cells.find(
      (c) =>
        floatEquals(this.offset.x + 1, c.offset.x) &&
        floatEquals(this.offset.y, c.offset.y) &&
        c.health > 0
    );
    this.downLeftCell = this.organism?.cells.find(
      (c) =>
        floatEquals(this.offset.x - 0.5, c.offset.x) &&
        floatEquals(this.offset.y + RAD_3_OVER_2, c.offset.y) &&
        c.health > 0
    );
    this.downRightCell = this.organism?.cells.find(
      (c) =>
        floatEquals(this.offset.x + 0.5, c.offset.x) &&
        floatEquals(this.offset.y + RAD_3_OVER_2, c.offset.y) &&
        c.health > 0
    );
  }
}
