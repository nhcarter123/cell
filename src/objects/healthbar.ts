export class HealthBar {
  private bar: Phaser.GameObjects.Graphics;
  readonly width: number;
  readonly height: number;
  readonly border: number;

  constructor(add: Phaser.GameObjects.GameObjectFactory) {
    this.bar = add.graphics();
    this.bar.depth = 10;
    this.width = 40;
    this.height = 9;
    this.border = 2;
  }

  draw(x: number, y: number, current: number, total: number, alpha: number) {
    this.bar.clear();

    if (alpha > 0.1) {
      this.bar.alpha = alpha;

      //  BG
      this.bar.fillStyle(0x000000);
      this.bar.fillRect(
        x - this.width / 2,
        y - this.height / 2,
        this.width,
        this.height
      );

      //  Health

      this.bar.fillStyle(0xffffff);
      this.bar.fillRect(
        x + this.border - this.width / 2,
        y + this.border - this.height / 2,
        this.width - 2 * this.border,
        this.height - 2 * this.border
      );

      if (current / total < 0.5) {
        this.bar.fillStyle(0xff0000);
      } else {
        this.bar.fillStyle(0x00ff00);
      }

      this.bar.fillRect(
        x + this.border - this.width / 2,
        y + this.border - this.height / 2,
        (this.width - 2 * this.border) * Math.max(current / total, 0),
        this.height - 2 * this.border
      );
    }
  }

  destroy() {
    this.bar.destroy();
  }
}
