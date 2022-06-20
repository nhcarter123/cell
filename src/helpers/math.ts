export const lerp = (a: number, b: number, c: number): number =>
  a + (b - a) * c;

export const pointDirX = (dist: number, angle: number): number =>
  dist * Math.cos(toRad(angle));

export const pointDirY = (dist: number, angle: number): number =>
  dist * Math.sin(toRad(angle));

export const pointDir = (x1: number, y1: number, x2: number, y2: number) => {
  const dy = y2 - y1;
  const dx = x2 - x1;
  return toDegree(Math.atan2(dy, dx));
};

export const pointDist = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

export const angleDiff = (facingAngle: number, angleOfTarget: number): number =>
  ((facingAngle - angleOfTarget + 180 + 360) % 360) - 180;

const toDegree = (ang: number): number => ang * (180 / Math.PI);

export const toRad = (ang: number): number => ang * (Math.PI / 180);
