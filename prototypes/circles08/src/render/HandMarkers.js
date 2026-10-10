import { GL, Draw } from "alfrid";
import vs from "../shaders/hand-marker.vert";
import fs from "../shaders/hand-marker.frag";

export default class HandMarkers {
  constructor() {
    this.point = new Draw().createMesh(GL.POINTS).bufferVertex([[0, 0, 0]])
      .bufferIndex([0]).useProgram(vs, fs);
  }

  draw(positions, camera) {
    if (!positions.length) return;
    const { gl } = GL;
    GL.setMatrices(camera);
    GL.disable(GL.DEPTH_TEST);
    GL.disable(GL.CULL_FACE);
    gl.depthMask(false);
    GL.enable(GL.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.point.uniform("uSize", 12 * GL.height / innerHeight);
    for (const position of positions) this.point.uniform("uPosition", position).draw();
    GL.disable(GL.BLEND);
    gl.depthMask(true);
  }

  dispose() {
    if (!this.point.shader.shaderProgram) return;
    this.point._mesh.destroy();
    this.point.shader.destroy();
  }
}
