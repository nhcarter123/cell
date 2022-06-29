import { ISavedCell } from "../context/saveData";

export default [
  {
    type: "BrainCell",
    offset: { x: 0, y: 0 },
    angleOffset: 0,
  },
  {
    type: "FatCell",
    offset: { x: 1, y: 0 },
    angleOffset: 0,
  },
  {
    type: "FatCell",
    offset: { x: 0.5, y: -0.8660254037844386 },
    angleOffset: 30,
  },
  {
    type: "FatCell",
    offset: { x: -0.5, y: -0.8660254037844386 },
    angleOffset: 330,
  },
  {
    type: "FatCell",
    offset: { x: -1, y: 0 },
    angleOffset: 270,
  },
  {
    type: "FatCell",
    offset: { x: -0.5, y: 0.8660254037844386 },
    angleOffset: 210,
  },
  {
    type: "FatCell",
    offset: { x: 0.5, y: 0.8660254037844386 },
    angleOffset: 150,
  },
  {
    type: "MouthCell",
    offset: { x: -1, y: -1.7320508075688772 },
    angleOffset: 330,
  },
  {
    type: "MouthCell",
    offset: { x: 1, y: -1.7320508075688772 },
    angleOffset: 30,
  },
  {
    type: "MouthCell",
    offset: { x: 2, y: 0 },
    angleOffset: 90,
  },
  {
    type: "MouthCell",
    offset: { x: 1, y: 1.7320508075688772 },
    angleOffset: 150,
  },
  {
    type: "MouthCell",
    offset: { x: -1, y: 1.7320508075688772 },
    angleOffset: 210,
  },
  {
    type: "MouthCell",
    offset: { x: -2, y: 0 },
    angleOffset: 270,
  },
] as ISavedCell[];
