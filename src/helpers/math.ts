import DegToRad = Phaser.Math.DegToRad;
import RadToDeg = Phaser.Math.RadToDeg;

export const lerp = (start: number, end: number, amt: number) =>
  (1 - amt) * start + amt * end;

export const pointDirX = (dist: number, angle: number): number =>
  dist * Math.cos(DegToRad(angle));

export const pointDirY = (dist: number, angle: number): number =>
  dist * Math.sin(DegToRad(angle));

export const pointDir = (x1: number, y1: number, x2: number, y2: number) => {
  const dy = y2 - y1;
  const dx = x2 - x1;
  return RadToDeg(Math.atan2(dy, dx));
};

export const pointDist = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

export const angleDiff = (facingAngle: number, angleOfTarget: number): number =>
  ((facingAngle - angleOfTarget + 180 + 360) % 360) - 180;

export const floatEquals = (f1: number, f2: number, depth = 4): boolean =>
  f1.toFixed(depth) === f2.toFixed(depth);
