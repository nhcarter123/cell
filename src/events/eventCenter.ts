import Phaser from "phaser";

export enum EBuyCell {
  MouthCell = "MouthCell",
}

export enum EEvent {
  BuyCell = "BuyCell",
}

const eventsCenter = new Phaser.Events.EventEmitter();

export default eventsCenter;
