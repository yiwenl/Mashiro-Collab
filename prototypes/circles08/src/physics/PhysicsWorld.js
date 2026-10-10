import { World, Body, Sphere, Box, Vec3, Material, ContactMaterial } from "cannon-es";
import HandColliders from "./HandColliders.js";

const STEP = 1 / 60;
const MAX_STEPS = 5;

export default class PhysicsWorld {
  constructor(layout, options) {
    this.layout = structuredClone(layout);
    this.options = { ...options };
    this.force = new Vec3();
    this.replay();
  }

  replay() {
    this.dispose();
    this.world = new World({ gravity: new Vec3(0, 0, 0),
      frictionGravity: new Vec3(0, -9.82, 0), allowSleep: false });
    this.world.solver.iterations = 15;
    const material = new Material("body");
    this.contact = new ContactMaterial(material, material, { friction: 0.15,
      restitution: this.options.restitution });
    this.world.addContactMaterial(this.contact);
    const handMaterial = new Material("hand");
    this.world.addContactMaterial(new ContactMaterial(material, handMaterial, {
      friction: 0.1, restitution: 0, contactEquationStiffness: 1e6, contactEquationRelaxation: 6,
    }));
    this.handColliders = new HandColliders(this.world, handMaterial);
    this.bodies = this.layout.specs.map(spec => {
      const sphere = spec.kind === "sphere";
      const r = sphere ? spec.size / 2 : 0;
      const dimensions = spec.dimensions;
      const body = new Body({
        mass: sphere ? 4 / 3 * Math.PI * r ** 3 : dimensions[0] * dimensions[1] * dimensions[2],
        shape: sphere ? new Sphere(r) : new Box(new Vec3(...dimensions.map(size => size / 2))),
        material,
        linearDamping: this.options.linearDamping,
        angularDamping: this.options.angularDamping,
        allowSleep: false,
      });
      body.position.set(...spec.position);
      body.quaternion.set(...spec.quaternion);
      this.world.addBody(body);
      return body;
    });
    this.poses = this.layout.specs.map(spec => ({ id: spec.id,
      position: [...spec.position], quaternion: [...spec.quaternion] }));
    this.resetClock();
  }

  advance(dtSeconds) {
    if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) return;
    this.accumulator += Math.min(dtSeconds, STEP * MAX_STEPS);
    let steps = 0;
    while (this.accumulator + 1e-10 >= STEP && steps < MAX_STEPS) {
      for (const body of this.bodies) {
        body.position.scale(-body.mass * this.options.attraction, this.force);
        body.applyForce(this.force);
      }
      this.handColliders.advance(STEP);
      this.world.step(STEP);
      this.accumulator = Math.max(0, this.accumulator - STEP);
      steps++;
    }
  }

  getPoses() {
    this.bodies.forEach((body, i) => {
      const { position, quaternion } = this.poses[i];
      position[0] = body.position.x;
      position[1] = body.position.y;
      position[2] = body.position.z;
      quaternion[0] = body.quaternion.x;
      quaternion[1] = body.quaternion.y;
      quaternion[2] = body.quaternion.z;
      quaternion[3] = body.quaternion.w;
    });
    return this.poses;
  }

  setHandTargets(targets, radius) { this.handColliders?.setTargets(targets, radius); }

  clearHands() { this.handColliders?.clear(); }

  getHandPositions() { return this.handColliders?.getPositions() ?? []; }

  configure(options) {
    Object.assign(this.options, options);
    this.contact.restitution = this.options.restitution;
    for (const body of this.bodies) {
      body.linearDamping = this.options.linearDamping;
      body.angularDamping = this.options.angularDamping;
    }
  }

  resetClock() { this.accumulator = 0; }

  dispose() {
    this.clearHands();
    this.handColliders = null;
    if (this.world) {
      for (const body of [...this.world.bodies]) this.world.removeBody(body);
    }
    this.bodies = [];
    this.poses = [];
    this.world = null;
  }
}
