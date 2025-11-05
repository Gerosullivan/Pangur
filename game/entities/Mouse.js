export class Mouse {
  constructor(data, context = {}) {
    this.id = data.id;
    this.position = data.position ?? null;
    this.status = data.status ?? 'alive';
    this.isResident = data.isResident ?? false;
    this.catch = data.catch ?? 1;
    this.health = data.health ?? 1;
    this.maxHealth = data.maxHealth ?? 1;
    this.isGrainFed = data.isGrainFed ?? false;
    this.stunned = data.stunned ?? false;
    this.context = context;
  }

  isAlive() {
    return this.status === 'alive';
  }
}

export function createMouseEntity(data, context) {
  return new Mouse(data, context);
}

export default Mouse;
