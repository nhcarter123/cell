import { compact } from "lodash";
import { Organism } from "../organism";
import { HealthBar } from "../healthbar";
import { BodyType, Vector } from "matter";
import { floatEquals, rotateVector } from "../../helpers/math";
import RadToDeg = Phaser.Math.RadToDeg;
import { EImageKey } from "../../scenes/load";
import { PHYSICS_DEFAULTS, RAD_3_OVER_2, RADIUS, SPACING } from "../../config";
import DegToRad = Phaser.Math.DegToRad;
import { MouthCell } from "./mouthCell";

type TCellOverrides = Partial<
  Pick<
    Cell,
    | "health"
    | "offset"
    | "mass"
    | "depth"
    | "isBone"
    | "imageKey"
    | "isBody"
    | "angleOffset"
    | "physicsAngleOffset"
    | "imageOffset"
    | "imageOffsetEditor"
    | "occupiedSpots"
    | "mustPlacePerpendicular"
    | "usesTint"
    | "speed"
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

  public readonly speed: number;
  public readonly usesTint: boolean;
  public readonly isBone: boolean;
  public readonly mustPlacePerpendicular: boolean;
  public readonly depth: number;
  public readonly mass: number;
  public readonly isBody: boolean;
  public readonly imageOffset: Vector;
  public readonly imageOffsetEditor: Vector;
  public angleOffset: number;
  public physicsAngleOffset: number;

  public health: number;
  public maxHealth: number;
  public previousHealth: number;
  public cannotHealDuration: number;
  public occupiedSpots: Vector[];

  public isConnected: boolean;
  public beenScanned: boolean;
  public boneId?: string;
  public imageKey: EImageKey;

  private healthBarAlpha: number;

  constructor(overrides: TCellOverrides) {
    this.depth = overrides.depth !== undefined ? overrides.depth : 0;
    this.mass = overrides.mass !== undefined ? overrides.mass : 1;
    this.speed = overrides.speed !== undefined ? overrides.speed : 1;
    this.offset =
      overrides.offset !== undefined ? overrides.offset : { x: 0, y: 0 };
    this.occupiedSpots =
      overrides.occupiedSpots !== undefined
        ? overrides.occupiedSpots
        : [{ x: 0, y: 0 }];
    this.isBody = overrides.isBody !== undefined ? overrides.isBody : true;
    this.mustPlacePerpendicular =
      overrides.mustPlacePerpendicular !== undefined
        ? overrides.mustPlacePerpendicular
        : false;
    this.isBone = overrides.isBone !== undefined ? overrides.isBone : false;
    this.usesTint =
      overrides.usesTint !== undefined ? overrides.usesTint : false;
    this.imageOffset =
      overrides.imageOffset !== undefined
        ? overrides.imageOffset
        : { x: 0.5, y: 0.5 };
    this.imageOffsetEditor =
      overrides.imageOffsetEditor !== undefined
        ? overrides.imageOffsetEditor
        : { x: 0.5, y: 0.5 };
    this.angleOffset =
      overrides.angleOffset !== undefined ? overrides.angleOffset : 0;
    this.imageKey =
      overrides.imageKey !== undefined ? overrides.imageKey : EImageKey.FatCell;
    this.health = overrides.health !== undefined ? overrides.health : 1;
    this.maxHealth = this.health; // potentially add this as an override

    this.previousHealth = this.health;
    this.cannotHealDuration = 0;
    this.physicsAngleOffset = 0;
    this.healthBarAlpha = 0;

    this.isConnected = true;
    this.beenScanned = false;

    this.links = [];
  }

  create(
    org: Organism,
    add: Phaser.GameObjects.GameObjectFactory,
    color: Phaser.Display.Color,
    matter?: Phaser.Physics.Matter.MatterPhysics,
    startAngle = 0,
    positionOverride?: Vector
  ) {
    this.organism = org;

    if (matter) {
      this.obj = this.createBody(matter, org, org.centerOfMass, startAngle);
      if (this.obj) {
        // @ts-ignore
        this.obj.cell = this;
        matter.world.add(this.obj);
      }
    }

    this.image = add.image(
      positionOverride === undefined
        ? org.centerOfMass.x + this.offset.x * SPACING
        : positionOverride.x,
      positionOverride === undefined
        ? org.centerOfMass.y + this.offset.y * SPACING
        : positionOverride.y,
      this.imageKey
    );
    // .setInteractive()
    // .on("pointerdown", () => (this.health = 0));

    if (this.usesTint) {
      this.image.setTint(color.color);
    }

    this.setImage(matter);

    this.image.scale = 0.65;
    this.image.depth = this.depth;

    if (matter) {
      this.image.setOrigin(this.imageOffset.x, this.imageOffset.y);
    } else {
      this.image.setOrigin(this.imageOffsetEditor.x, this.imageOffsetEditor.y);
    }

    this.image.angle = this.angleOffset;

    this.healthBar = new HealthBar(add);

    this.setChildrenCells();
  }

  createBody(
    matter: Phaser.Physics.Matter.MatterPhysics,
    org: Organism,
    startPosition: Vector,
    angle: number,
    onCollideActiveCallback?: Function
  ): BodyType | undefined {
    // this.obj = matter.add.circle(
    //   org.centerOfMass.x + this.offsetX * SPACING,
    //   org.centerOfMass.y + this.offsetY * SPACING,
    //   RADIUS,
    //   {
    //     restitution: 0,
    //     mass: this.mass,
    //   }
    // );
    const offset = rotateVector(
      { x: 0, y: 0 },
      { x: this.offset.x * SPACING, y: this.offset.y * SPACING },
      angle
    );

    this.physicsAngleOffset = this.angleOffset;

    return matter.bodies.polygon(
      startPosition.x + offset.x,
      startPosition.y + offset.y,
      6,
      RADIUS,
      {
        ...PHYSICS_DEFAULTS,
        mass: this.mass,
        angle: DegToRad(angle),
        onCollideActiveCallback,
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
    if (this.upLeftCell?.obj) {
      return {
        cell: this.upLeftCell,
        angle: 240,
      };
    }

    if (this.upRightCell?.obj) {
      return {
        cell: this.upRightCell,
        angle: 300,
      };
    }

    if (this.rightCell?.obj) {
      return {
        cell: this.rightCell,
        angle: 0,
      };
    }

    if (this.downRightCell?.obj) {
      return {
        cell: this.downRightCell,
        angle: 60,
      };
    }

    if (this.downLeftCell?.obj) {
      return {
        cell: this.downLeftCell,
        angle: 120,
      };
    }

    if (this.leftCell?.obj) {
      return {
        cell: this.leftCell,
        angle: 180,
      };
    }
  }

  update(attacking: boolean, matter?: Phaser.Physics.Matter.MatterPhysics) {
    if (!this.isConnected && matter) {
      this.health -= 0.005;
    }

    this.setImage(matter);

    if (this.health < this.maxHealth) {
      this.healthBarAlpha = 90;
    } else {
      this.healthBarAlpha -= 1;
    }

    if (this.healthBarAlpha && this.healthBar && this.obj) {
      this.healthBar.draw(
        this.obj.position.x,
        this.obj.position.y,
        this.health,
        this.maxHealth,
        this.healthBarAlpha / 90
      );
    }

    // prevent healing when damaged
    if (this.health !== this.previousHealth) {
      this.cannotHealDuration = 1200;
    }

    if (this.cannotHealDuration > 0) {
      this.cannotHealDuration -= 1;
    } else if (this.isConnected) {
      this.health += Math.min(this.maxHealth - this.health, 0.006);
    }

    if (this.health <= 0 && this.previousHealth > 0) {
      this.organism?.syncCells(matter);
    }

    this.previousHealth = this.health;
  }

  removeLinks(matter?: Phaser.Physics.Matter.MatterPhysics) {
    if (matter) {
      matter.world.removeConstraint(this.links.map((link) => link.link));
      this.links = [];
    }
  }

  destroy(matter?: Phaser.Physics.Matter.MatterPhysics) {
    if (matter && this.obj) {
      matter.world.remove(this.obj.parent);
      this.removeLinks(matter);

      if (this.boneId && this.organism) {
        this.organism.dirtyBones.push(this.boneId);
      }
    }
    this.image?.destroy();
    this.healthBar?.destroy();
  }

  checkPerpendicular(normalAngle: number): boolean {
    if (!this.mustPlacePerpendicular) {
      return true;
    }

    return this.angleOffset === normalAngle;
  }

  setChildrenCells() {
    this.leftCell = this.organism?.cells.find(
      (c) =>
        floatEquals(this.offset.x - 1, c.offset.x) &&
        floatEquals(this.offset.y, c.offset.y) &&
        this.checkPerpendicular(90) &&
        c.checkPerpendicular(270)
    );

    this.upLeftCell = this.organism?.cells.find(
      (c) =>
        floatEquals(this.offset.x - 0.5, c.offset.x) &&
        floatEquals(this.offset.y - RAD_3_OVER_2, c.offset.y) &&
        this.checkPerpendicular(150) &&
        c.checkPerpendicular(330)
    );

    this.upRightCell = this.organism?.cells.find(
      (c) =>
        floatEquals(this.offset.x + 0.5, c.offset.x) &&
        floatEquals(this.offset.y - RAD_3_OVER_2, c.offset.y) &&
        this.checkPerpendicular(210) &&
        c.checkPerpendicular(30)
    );

    this.rightCell = this.organism?.cells.find(
      (c) =>
        floatEquals(this.offset.x + 1, c.offset.x) &&
        floatEquals(this.offset.y, c.offset.y) &&
        this.checkPerpendicular(270) &&
        c.checkPerpendicular(90)
    );

    this.downRightCell = this.organism?.cells.find(
      (c) =>
        floatEquals(this.offset.x + 0.5, c.offset.x) &&
        floatEquals(this.offset.y + RAD_3_OVER_2, c.offset.y) &&
        this.checkPerpendicular(330) &&
        c.checkPerpendicular(150)
    );

    this.downLeftCell = this.organism?.cells.find(
      (c) =>
        floatEquals(this.offset.x - 0.5, c.offset.x) &&
        floatEquals(this.offset.y + RAD_3_OVER_2, c.offset.y) &&
        this.checkPerpendicular(30) &&
        c.checkPerpendicular(210)
    );
  }

  setImage(matter?: Phaser.Physics.Matter.MatterPhysics) {
    if (this.image) {
      if (this.obj) {
        this.image.x = this.obj.position.x;
        this.image.y = this.obj.position.y;

        this.image.angle =
          this.obj.parent === this.obj
            ? RadToDeg(this.obj.angle) + this.physicsAngleOffset
            : RadToDeg(this.obj.parent.angle) + this.angleOffset;
      } else if (matter) {
        const neighbor = this.getFirstNeighborCell();
        if (neighbor?.cell.obj) {
          this.image.x = neighbor.cell.obj.position.x;
          this.image.y = neighbor.cell.obj.position.y;
          this.image.angle =
            RadToDeg(neighbor.cell.obj.parent.angle) + this.angleOffset;
          this.image.alpha =
            neighbor.cell.health > neighbor.cell.maxHealth * 0.75 ? 1 : 0;
        }
      } else {
        this.image.angle = this.angleOffset;
      }
    }
  }
}
