import { GL, Draw, Geom, GLShader } from "alfrid";
import { mat3, mat4 } from "gl-matrix";
import vs from "../shaders/body.vert";
import fs from "../shaders/body.frag";

export default class DrawBody {
  constructor() {
    this.shader = new GLShader(vs, fs);
    this.meshes = { sphere: Geom.sphere(1, 48), cube: Geom.cube(1, 1, 1) };
    this.drawCall = new Draw().useProgram(this.shader);
    this.matrix = mat4.create();
    this.normalMatrix = mat3.create();
    this.scale = [1, 1, 1];
    this.used = new Set();
  }

  draw(spec, pose, { shading }) {
    const meshKind = spec.kind === "sphere" ? "sphere" : "cube";
    const scale = spec.kind === "sphere" ? this.scale.fill(spec.size / 2) : spec.dimensions;
    mat4.fromRotationTranslationScale(this.matrix, pose.quaternion, pose.position, scale);
    mat3.normalFromMat4(this.normalMatrix, this.matrix);
    GL.setModelMatrix(this.matrix);
    this.drawCall.setMesh(this.meshes[meshKind])
      .uniform("uWorldNormalMatrix", this.normalMatrix).uniform("uShading", shading).draw();
    this.used.add(meshKind);
  }

  dispose() {
    for (const kind of this.used) this.meshes[kind].destroy();
    if (this.shader.shaderProgram) this.shader.destroy();
  }
}
