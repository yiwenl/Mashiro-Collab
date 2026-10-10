export default class FpsMeter {
  constructor(element) {
    this.element = element;
    this.reset();
  }

  reset() {
    this.startTime = null;
    this.frames = 0;
    this.element.textContent = "— FPS";
  }

  update(time) {
    if (this.startTime === null) {
      this.startTime = time;
      return;
    }
    this.frames++;
    const elapsed = time - this.startTime;
    if (elapsed < 500) return;
    this.element.textContent = `${Math.round(this.frames * 1000 / elapsed)} FPS`;
    this.frames = 0;
    this.startTime = time;
  }
}
