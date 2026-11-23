type HomeShelfAutoplayState = {
  canRotate: boolean;
  visible: boolean;
  pageVisible: boolean;
  reducedMotion: boolean;
  hovered: boolean;
  focused: boolean;
  dragging: boolean;
  paused: boolean;
};

export function shouldAutoplayHomeShelves({ canRotate, visible, pageVisible, reducedMotion, hovered, focused, dragging, paused }: HomeShelfAutoplayState) {
  return canRotate && visible && pageVisible && !reducedMotion && !hovered && !focused && !dragging && !paused;
}
