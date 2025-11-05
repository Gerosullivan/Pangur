import { HUNTING_RANGE } from '../config/constants.js';

export class Cat {
  constructor(data, context) {
    this.id = data.id;
    this.name = data.name;
    this.position = data.position;
    this.catch = data.catch;
    this.meow = data.meow;
    this.health = data.health;
    this.maxHealth = data.maxHealth;
    this.huntingRange = data.huntingRange ?? HUNTING_RANGE.BASIC;
    this.isKitten = data.isKitten;
    this.isAdult = data.isAdult;
    this.waveStats = { ...(data.waveStats ?? { catches: 0, deters: 0, damageTaken: 0 }) };
    this.context = context;
  }

  canAttack() {
    return this.catch > 0 && this.isAlive();
  }

  canMeow() {
    return this.meow > 0 && this.isAlive();
  }

  isAlive() {
    return this.health > 0;
  }

  isAggressive() {
    return this.catch > this.meow;
  }

  attack(target) {
    return this.context.entityManager.resolveCatAttack(this.id, target);
  }

  deter(targetIndex) {
    return this.context.entityManager.resolveCatMeow(this.id, targetIndex);
  }

  takeDamage(amount, source) {
    return this.context.entityManager.applyDamage(this.id, amount, source);
  }
}

export function createCatEntity(data, context) {
  return new Cat(data, context);
}

export default Cat;
