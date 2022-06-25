import { Cell } from "../objects/cells/cell";
import { ECellType } from "../events/eventCenter";

class EditorState {
  public mouseCell?: Cell;
  public type: ECellType;
  public rotationIndex: number;

  constructor() {
    this.type = ECellType.FatCell;
    this.rotationIndex = 0;
  }
}

const editorState = new EditorState();

export default editorState;
