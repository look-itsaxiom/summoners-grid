import { Position, Stats, PlayerType, RoleFamily, Species, CombatResult, Attribute } from './types.js';
import { SummonCard, RoleCard, EquipmentCard } from './cards.js';

export class SummonUnit {
    public readonly id: string;
    public readonly summonCard: SummonCard;
    public readonly roleCard: RoleCard;
    public readonly owner: PlayerType;
    public position: Position;
    public level: number;
    public currentHp: number = 0;
    public maxHp: number = 0;
    public hasAttackedThisTurn: boolean;
    public hasMovedThisTurn: boolean;
    public movementUsed: number;

    constructor(
        id: string,
        summonCard: SummonCard,
        roleCard: RoleCard,
        owner: PlayerType,
        position: Position
    ) {
        this.id = id;
        this.summonCard = summonCard;
        this.roleCard = roleCard;
        this.owner = owner;
        this.position = position;
        this.level = 5; // Starting level
        this.hasAttackedThisTurn = false;
        this.hasMovedThisTurn = false;
        this.movementUsed = 0;

        this.calculateStats();
    }

    get species(): Species {
        return this.summonCard.species;
    }

    get roleFamily(): RoleFamily {
        return this.roleCard.roleFamily;
    }

    get equipment(): EquipmentCard[] {
        return this.summonCard.equipment;
    }

    get weapon(): EquipmentCard | undefined {
        return this.equipment.find(eq => eq.slot === 'Weapon');
    }

    calculateStats(): void {
        const baseStats = this.summonCard.baseStats;
        const growthRates = this.summonCard.growthRates;
        const roleModifiers = this.roleCard.statModifiers;

        // Calculate stats with growth and role modifiers
        const calculatedStats: Stats = {
            str: Math.floor((baseStats.str + Math.floor(this.level * growthRates.str)) * (1 + roleModifiers.str)),
            end: Math.floor((baseStats.end + Math.floor(this.level * growthRates.end)) * (1 + roleModifiers.end)),
            def: Math.floor((baseStats.def + Math.floor(this.level * growthRates.def)) * (1 + roleModifiers.def)),
            int: Math.floor((baseStats.int + Math.floor(this.level * growthRates.int)) * (1 + roleModifiers.int)),
            spi: Math.floor((baseStats.spi + Math.floor(this.level * growthRates.spi)) * (1 + roleModifiers.spi)),
            mdf: Math.floor((baseStats.mdf + Math.floor(this.level * growthRates.mdf)) * (1 + roleModifiers.mdf)),
            spd: Math.floor((baseStats.spd + Math.floor(this.level * growthRates.spd)) * (1 + roleModifiers.spd)),
            acc: Math.floor((baseStats.acc + Math.floor(this.level * growthRates.acc)) * (1 + roleModifiers.acc)),
            lck: Math.floor((baseStats.lck + Math.floor(this.level * growthRates.lck)) * (1 + roleModifiers.lck))
        };

        // Add equipment bonuses
        this.equipment.forEach(eq => {
            if (eq.statBonuses) {
                Object.keys(eq.statBonuses).forEach(stat => {
                    if (stat in calculatedStats) {
                        (calculatedStats as any)[stat] += eq.statBonuses[stat];
                    }
                });
            }
        });

        this.stats = calculatedStats;

        // Calculate derived properties
        const newMaxHp = 50 + Math.floor(Math.pow(calculatedStats.end, 1.5));
        if (this.maxHp === undefined) {
            // First time setting HP
            this.maxHp = newMaxHp;
            this.currentHp = newMaxHp;
        } else {
            // Level up - preserve damage taken
            const damageAbletoKp = this.maxHp - this.currentHp;
            this.maxHp = newMaxHp;
            this.currentHp = Math.max(1, this.maxHp - damageAbletoKp);
        }
    }

    public stats: Stats = {
        str: 0, end: 0, def: 0, int: 0, spi: 0, mdf: 0, spd: 0, acc: 0, lck: 0
    };

    levelUp(): void {
        this.level++;
        this.calculateStats();
    }

    get movementSpeed(): number {
        return 2 + Math.floor((this.stats.spd - 10) / 5);
    }

    get remainingMovement(): number {
        return Math.max(0, this.movementSpeed - this.movementUsed);
    }

    canMoveTo(newPosition: Position): boolean {
        // Use Chebyshev distance (diagonal movement allowed) to match UI indicators
        const distance = Math.max(
            Math.abs(newPosition.x - this.position.x),
            Math.abs(newPosition.y - this.position.y)
        );
        return distance <= this.remainingMovement;
    }

    moveTo(newPosition: Position): void {
        // Use Chebyshev distance to calculate movement cost
        const distance = Math.max(
            Math.abs(newPosition.x - this.position.x),
            Math.abs(newPosition.y - this.position.y)
        );
        this.movementUsed += distance;
        this.position = newPosition;
        this.hasMovedThisTurn = true;
    }

    canAttack(): boolean {
        return !this.hasAttackedThisTurn;
    }

    getAttackRange(): number {
        return this.weapon?.range || 1;
    }

    canAttackTarget(target: SummonUnit): boolean {
        if (!this.canAttack()) return false;
        // Use Chebyshev distance (allows diagonal attacks) instead of Manhattan distance
        const distance = Math.max(
            Math.abs(target.position.x - this.position.x), 
            Math.abs(target.position.y - this.position.y)
        );
        return distance <= this.getAttackRange();
    }

    calculateToHit(_target: SummonUnit): number {
        const baseAccuracy = this.weapon ? 90 : 85; // Basic attack has 90% base, no weapon has 85%
        return Math.min(95, baseAccuracy + (this.stats.acc / 10));
    }

    calculateCritChance(): number {
        return Math.floor((this.stats.lck * 0.3375) + 1.65);
    }

    performAttack(target: SummonUnit): CombatResult {
        if (!this.canAttackTarget(target)) {
            return { hit: false };
        }

        // Hit calculation
        const toHit = this.calculateToHit(target);
        const hitRoll = Math.random() * 100;
        const hit = hitRoll <= toHit;

        if (!hit) {
            this.hasAttackedThisTurn = true;
            return { hit: false };
        }

        // Critical hit check
        const critChance = this.calculateCritChance();
        const critRoll = Math.random() * 100;
        const isCritical = critRoll <= critChance;

        // Damage calculation
        let damage: number;
        const weapon = this.weapon;
        
        if (weapon && weapon.slot === 'Weapon') {
            // Weapon-based attack
            if (weapon.name.includes('Bow')) {
                // Bow formula: ((STR + ACC)/2) × (1 + WeaponPower/100) × (STR/TargetDEF)
                damage = ((this.stats.str + this.stats.acc) / 2) * (1 + weapon.power / 100) * (this.stats.str / target.stats.def);
            } else if (weapon.name.includes('Wand')) {
                // Magical weapon: INT × (1 + WeaponPower/100) × (INT/TargetMDF)
                damage = this.stats.int * (1 + weapon.power / 100) * (this.stats.int / target.stats.mdf);
            } else {
                // Melee weapon: STR × (1 + WeaponPower/100) × (STR/TargetDEF)
                damage = this.stats.str * (1 + weapon.power / 100) * (this.stats.str / target.stats.def);
            }
        } else {
            // No weapon - basic attack
            damage = this.stats.str * 0.5 * (this.stats.str / target.stats.def);
        }

        if (isCritical) {
            damage *= 1.5;
        }

        const finalDamage = Math.floor(damage);
        
        // Apply damage
        target.takeDamage(finalDamage);
        
        this.hasAttackedThisTurn = true;

        return {
            hit: true,
            damage: {
                damage: finalDamage,
                isCritical,
                damageType: weapon?.attribute || Attribute.Neutral
            }
        };
    }

    takeDamage(amount: number): void {
        this.currentHp = Math.max(0, this.currentHp - amount);
    }

    isDefeated(): boolean {
        return this.currentHp <= 0;
    }

    heal(amount: number): void {
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    }

    resetTurnFlags(): void {
        this.hasAttackedThisTurn = false;
        this.hasMovedThisTurn = false;
        this.movementUsed = 0;
    }

    getDisplayName(): string {
        return `L${this.level} ${this.species} ${this.roleCard.name}`;
    }

    getStatusText(): string {
        return `${this.currentHp}/${this.maxHp} HP`;
    }

    getStats(): Stats {
        return this.stats;
    }
}