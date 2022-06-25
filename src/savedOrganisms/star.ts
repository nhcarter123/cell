import { ISavedCell } from "../context/saveData";

export default [
  {
    type: "BrainCell",
    offsetX: 0,
    offsetY: 0,
    angleOffset: 0,
  },
  {
    type: "FatCell",
    offsetX: 1,
    offsetY: 0,
    angleOffset: 0,
  },
  {
    type: "FatCell",
    offsetX: 0.5,
    offsetY: -0.8660254037844386,
    angleOffset: 30,
  },
  {
    type: "FatCell",
    offsetX: -0.5,
    offsetY: -0.8660254037844386,
    angleOffset: 330,
  },
  {
    type: "FatCell",
    offsetX: -1,
    offsetY: 0,
    angleOffset: 270,
  },
  {
    type: "FatCell",
    offsetX: -0.5,
    offsetY: 0.8660254037844386,
    angleOffset: 210,
  },
  {
    type: "FatCell",
    offsetX: 0.5,
    offsetY: 0.8660254037844386,
    angleOffset: 150,
  },
  {
    type: "MouthCell",
    offsetX: -1,
    offsetY: -1.7320508075688772,
    angleOffset: 330,
  },
  {
    type: "MouthCell",
    offsetX: 1,
    offsetY: -1.7320508075688772,
    angleOffset: 30,
  },
  {
    type: "MouthCell",
    offsetX: 2,
    offsetY: 0,
    angleOffset: 90,
  },
  {
    type: "MouthCell",
    offsetX: 1,
    offsetY: 1.7320508075688772,
    angleOffset: 150,
  },
  {
    type: "MouthCell",
    offsetX: -1,
    offsetY: 1.7320508075688772,
    angleOffset: 210,
  },
  {
    type: "MouthCell",
    offsetX: -2,
    offsetY: 0,
    angleOffset: 270,
  },
] as ISavedCell[];
