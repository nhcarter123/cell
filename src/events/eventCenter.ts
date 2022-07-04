import Phaser from "phaser";

export enum ECellType {
  MouthCell = "MouthCell",
  FatCell = "FatCell",
  BrainCell = "BrainCell",
  SpikeCell = "SpikeCell",
  BoneCell = "BoneCell",
  CiliaCell = "CiliaCell",
}

export enum EEvent {
  BuyCell = "BuyCell",
  Continue = "Continue",
}

const eventsCenter = new Phaser.Events.EventEmitter();

export default eventsCenter;
