import { GL, Draw, DrawCopy, Geom, FrameBuffer } from "alfrid";
import fullscreen from "../shaders/fullscreen.vert";
import differenceMask from "../shaders/difference-mask.frag";
import contour from "../shaders/contour.frag";

export default class ContourRenderer {
  constructor() {
    this.extract = new Draw().setMesh(Geom.bigTriangle()).useProgram(fullscreen, differenceMask);
    this.edges = new Draw().setMesh(Geom.bigTriangle()).useProgram(fullscreen, contour);
    this.overlay = new DrawCopy();
  }

  resize(width, height) {
    if (this.difference?.width === width && this.difference?.height === height) return;
    this.releaseTargets();
    const options = { minFilter: GL.LINEAR, magFilter: GL.LINEAR, mipmap: false, type: GL.UNSIGNED_BYTE };
    this.difference = new FrameBuffer(width, height, options);
    this.contour = new FrameBuffer(width, height, options);
    // Allocate even while disabled, so resize/dispose never touch uninitialized targets.
    const { gl } = GL;
    gl.depthMask(true);
    for (const fbo of [this.difference, this.contour]) {
      fbo.bind();
      const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      GL.clear(0, 0, 0, 0);
      fbo.unbind();
      if (!complete) throw new Error("Unable to create the contour surface on this device.");
    }
  }

  draw(accumulation, width) {
    // Caller has disabled depth, culling, and blending for fullscreen passes.
    this.difference.bind();
    this.extract.bindTexture("uSource", accumulation, 0).draw();
    this.difference.unbind();

    this.contour.bind();
    this.edges.bindTexture("uDifference", this.difference.texture, 0)
      .uniform("uResolution", [GL.width, GL.height])
      // Width is the full stroke width in CSS pixels, centered on each boundary.
      .uniform("uOffset", [width * 0.5 / innerWidth, width * 0.5 / innerHeight]).draw();
    this.contour.unbind();

    const { gl } = GL;
    GL.enable(GL.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.overlay.draw(this.contour.texture);
    GL.disable(GL.BLEND);
  }

  releaseTargets() {
    this.difference?.destroy();
    this.contour?.destroy();
    this.difference = null;
    this.contour = null;
  }

  dispose() {
    this.releaseTargets();
    for (const draw of [this.extract, this.edges, this.overlay]) {
      if (draw.shader.shaderProgram) {
        draw._mesh.destroy();
        draw.shader.destroy();
      }
    }
  }
}
