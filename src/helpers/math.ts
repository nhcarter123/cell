import DegToRad = Phaser.Math.DegToRad;
import RadToDeg = Phaser.Math.RadToDeg;
import { Vector } from "matter";
import { IBounds } from "../objects/organism";

export const lerp = (start: number, end: number, amt: number) =>
  (1 - amt) * start + amt * end;

export const lengthDirX = (dist: number, angle: number): number =>
  dist * Math.cos(DegToRad(angle));

export const lengthDirY = (dist: number, angle: number): number =>
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

export const angleDiff = (
  facingAngle: number,
  angleOfTarget: number
): number => {
  let diff = ((facingAngle - angleOfTarget + 180 + 360) % 360) - 180;

  if (diff < -180) {
    diff += 360;
  }

  return diff;
};

export const addVectors = (v1: Vector, v2: Vector): Vector => ({
  x: v1.x + v2.x,
  y: v1.y + v2.y,
});

export const subtractVectors = (v1: Vector, v2: Vector): Vector => ({
  x: v1.x - v2.x,
  y: v1.y - v2.y,
});

export const rotateVector = (
  origin: Vector,
  point: Vector,
  angle: number
): Vector => {
  const radians = DegToRad(-angle),
    cos = Math.cos(radians),
    sin = Math.sin(radians),
    nx = cos * (point.x - origin.x) + sin * (point.y - origin.y) + origin.x,
    ny = cos * (point.y - origin.y) - sin * (point.x - origin.x) + origin.y;
  return {
    x: nx,
    y: ny,
  };
};

export const floatEquals = (
  f1: number,
  f2: number,
  accuracy = 0.0001
): boolean => Math.abs(f1 - f2) < accuracy;

export const pointsEqual = (v1: Vector, v2: Vector): boolean => {
  return floatEquals(v1.x, v2.x) && floatEquals(v1.y, v2.y);
};

export const safeAngle = (angle: number): number => {
  const ang = angle % 360;

  if (ang < 0) {
    return ang + 360;
  }

  return ang;
};

export const getMaxDiff = (bounds: IBounds): number => {
  return Math.max(
    Math.abs(bounds.x.min - bounds.x.max),
    Math.abs(bounds.y.min - bounds.y.max)
  );
};

export const getCenter = (bounds: IBounds): Vector => {
  return {
    x: (bounds.x.min + bounds.x.max) / 2,
    y: (bounds.y.min + bounds.y.max) / 2,
  };
};
