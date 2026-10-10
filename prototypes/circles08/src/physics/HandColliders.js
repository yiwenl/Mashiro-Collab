import { Body, Sphere, Vec3 } from "cannon-es";

export default class HandColliders {
  constructor(world, material) {
    this.world = world;
    this.material = material;
    this.hands = new Map();
    this.delta = new Vec3();
  }

  setTargets(targets, radius) {
    if (!Number.isFinite(radius) || radius <= 0) { this.clear(); return; }
    const active = new Set();
    for (const { id, position } of targets) {
      if (!Array.isArray(position) || position.length !== 3 || !position.every(Number.isFinite)) continue;
      active.add(id);
      let hand = this.hands.get(id);
      if (!hand) {
        const body = new Body({ type: Body.KINEMATIC, mass: 0, shape: new Sphere(radius),
          material: this.material, collisionFilterGroup: 2, collisionFilterMask: 1 });
        body.position.set(...position);
        hand = { body, target: new Vec3(...position) };
        this.hands.set(id, hand);
        this.world.addBody(body);
      }
      hand.target.set(...position);
      const shape = hand.body.shapes[0];
      if (shape.radius !== radius) {
        shape.radius = radius;
        shape.updateBoundingSphereRadius();
        hand.body.updateBoundingRadius();
        hand.body.aabbNeedsUpdate = true;
      }
    }
    for (const [id, { body }] of this.hands) {
      if (!active.has(id)) { this.world.removeBody(body); this.hands.delete(id); }
    }
  }

  advance(dt) {
    for (const { body, target } of this.hands.values()) {
      target.vsub(body.position, this.delta);
      // Move with velocity so contacts receive motion; do not teleport through the scene.
      this.delta.scale((1 - Math.exp(-20 * dt)) / dt, body.velocity);
      const speed = body.velocity.length();
      const maxSpeed = Math.min(12, body.shapes[0].radius * 0.5 / dt);
      if (speed > maxSpeed) body.velocity.scale(maxSpeed / speed, body.velocity);
    }
  }

  clear() {
    for (const { body } of this.hands.values()) this.world.removeBody(body);
    this.hands.clear();
  }

  getPositions() {
    return Array.from(this.hands.values(), ({ body }) => body.position.toArray());
  }
}
