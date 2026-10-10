import { GL, Draw, Geom, FrameBuffer, FboPingPong, ShaderLibs } from "alfrid";
import { mat4 } from "gl-matrix";
import DrawBody from "./DrawBody.js";
import fs from "../shaders/difference.frag";
import fullscreen from "../shaders/fullscreen.vert";
import intersections from "../shaders/intersections.frag";
import colorize from "../shaders/colorize.frag";
import MaterialAtlas from "./MaterialAtlas.js";
import ContourRenderer from "./ContourRenderer.js";
import copyOpaque from "../shaders/copy-opaque.frag";

export default class DifferenceRenderer {
  constructor(width, height) {
    this.body = new DrawBody();
    this.identity = mat4.create();
    this.composite = new Draw().setMesh(Geom.bigTriangle()).useProgram(ShaderLibs.bigTriangleVert, fs);
    this.intersections = new Draw().setMesh(Geom.bigTriangle()).useProgram(fullscreen, intersections);
    this.colorize = new Draw().setMesh(Geom.bigTriangle()).useProgram(fullscreen, colorize);
    this.copy = new Draw().setMesh(Geom.bigTriangle()).useProgram(fullscreen, copyOpaque);
    this.contours = new ContourRenderer();
    this.materials = new MaterialAtlas(window.fxhash);
    this.supportsColor = !!GL.extensions["EXT_color_buffer_float"];
    this.accumulationType = GL.UNSIGNED_BYTE;
    // Each channel stays in 0..65535, exactly representable in a 32-bit float.
    this.codes = Array.from({ length: 40 }, (_, id) => {
      const code = [0, 0, 0];
      code[Math.floor(id / 16)] = 2 ** (id % 16);
      return code;
    });
    this.rodMask = [0, 0, 0];
    this.resize(width, height);
  }

  resize(width, height) {
    if (this.object?.width === width && this.object?.height === height) return;
    this.releaseTargets();
    const options = { minFilter: GL.NEAREST, magFilter: GL.NEAREST, mipmap: false, type: GL.UNSIGNED_BYTE };
    this.object = new FrameBuffer(width, height, options);
    this.initializeTargets([this.object]);
    this.setAccumulationType(this.accumulationType);
    this.contours.resize(width, height);
  }

  setAccumulationType(type) {
    if (this.accumulation && this.accumulationType === type) return;
    this.accumulation?.all.forEach(fbo => fbo.destroy());
    this.accumulationType = type;
    const options = { minFilter: GL.NEAREST, magFilter: GL.NEAREST, mipmap: false, type };
    this.accumulation = new FboPingPong(this.object.width, this.object.height, options);
    this.initializeTargets(this.accumulation.all);
  }

  initializeTargets(targets) {
    // Allocate even unused targets, so an empty scene can safely resize or dispose.
    const { gl } = GL;
    gl.depthMask(true);
    for (const fbo of targets) {
      fbo.bind();
      const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      GL.clear(0, 0, 0, 0);
      fbo.unbind();
      if (!complete) throw new Error("Unable to create the rendering surface on this device.");
    }
  }

  objectState(camera) {
    GL.enable(GL.DEPTH_TEST);
    GL.enable(GL.CULL_FACE);
    GL.disable(GL.BLEND);
    GL.gl.depthMask(true);
    GL.setMatrices(camera);
  }

  screenState() {
    GL.disable(GL.DEPTH_TEST);
    GL.disable(GL.CULL_FACE);
    GL.disable(GL.BLEND);
    GL.gl.depthMask(false);
    GL.setModelMatrix(this.identity);
  }

  render(specs, poses, camera, { shading, mode, palette, patternAmount, patternScale, contour, contourWidth }) {
    const colored = mode === "color" && this.supportsColor;
    this.setAccumulationType(colored ? GL.FLOAT : GL.UNSIGNED_BYTE);
    this.screenState();
    this.accumulation.read.bind();
    const background = colored ? 0 : 1;
    GL.clear(background, background, background, 1);
    this.accumulation.read.unbind();
    this.rodMask.fill(0);

    for (let i = 0; i < specs.length; i++) {
      this.objectState(camera);
      this.object.bind();
      GL.clear(0, 0, 0, 0);
      this.body.draw(specs[i], poses[i], { shading: colored ? 0 : shading });
      this.object.unbind();

      this.screenState();
      this.accumulation.write.bind();
      const composite = colored ? this.intersections : this.composite;
      if (colored) {
        const code = this.codes[specs[i].id];
        composite.uniform("uCode", code);
        if (specs[i].kind === "rod") {
          for (let channel = 0; channel < 3; channel++) this.rodMask[channel] += code[channel];
        }
      }
      composite.bindTexture("uAccumulation", this.accumulation.read.texture, 0)
        .bindTexture("uObject", this.object.texture, 1).draw();
      this.accumulation.write.unbind();
      this.accumulation.swap();
    }

    this.screenState();
    if (colored) {
      this.materials.update(palette);
      this.colorize.bindTexture("uCombinations", this.accumulation.read.texture, 0)
        .bindTexture("uMaterials", this.materials.texture, 1)
        .uniform("uTileInfo", this.materials.tileInfo)
        .uniform("uSolidCount", "int", this.materials.solidCount)
        .uniform("uPatternCount", "int", this.materials.patternCount)
        .uniform("uPatternAmount", patternAmount)
        .uniform("uRodMask", this.rodMask)
        .uniform("uPatternScale", patternScale)
        .uniform("uPixelRatio", [GL.width / innerWidth, GL.height / innerHeight])
        .uniform("uViewport", [GL.width, GL.height]).draw();
    } else {
      this.copy.bindTexture("uSource", this.accumulation.read.texture, 0).draw();
    }
    if (contour) this.contours.draw(this.accumulation.read.texture, contourWidth);
    GL.gl.depthMask(true);
  }

  renderNormal(specs, poses, camera) {
    this.objectState(camera);
    GL.viewport(0, 0, GL.width, GL.height);
    GL.clear(0.93, 0.93, 0.93, 1);
    for (let i = 0; i < specs.length; i++) this.body.draw(specs[i], poses[i], { shading: 1 });
    GL.setModelMatrix(this.identity);
  }

  releaseTargets() {
    this.object?.destroy();
    this.accumulation?.all.forEach(fbo => fbo.destroy());
    this.object = null;
    this.accumulation = null;
  }

  dispose() {
    this.releaseTargets();
    this.body.dispose();
    this.materials.dispose();
    this.contours.dispose();
    for (const draw of [this.composite, this.intersections, this.colorize, this.copy]) {
      if (draw.shader.shaderProgram) {
        draw._mesh.destroy();
        draw.shader.destroy();
      }
    }
  }
}
