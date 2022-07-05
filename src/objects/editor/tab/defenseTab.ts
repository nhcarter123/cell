import { Tab } from "./tab";
import { EImageKey } from "../../../scenes/load";
import { SpikeCellContent } from "../shopContent/spikeCellContent";

export class DefenseTab extends Tab {
  constructor() {
    super(EImageKey.SpikeCell, [new SpikeCellContent()]);

    this.scale = 0.4;
  }
}
