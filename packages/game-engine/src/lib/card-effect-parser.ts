import {
  CardEffect,
  CardRequirements,
  Speed,
} from '@summoners-grid/shared-types';

/**
 * Raw card effect data structure (from database/JSON)
 */
export interface RawCardEffect {
  [key: string]: any;
}

/**
 * Card effect parser that converts JSON data to executable CardEffect objects
 * Implements the "card effect definition parser from JSON data" requirement
 */
export class CardEffectParser {
  /**
   * Parse raw card effects from Alpha Card data into executable CardEffect objects
   */
  public static parseAlphaCardEffects(
    cardId: string,
    cardName: string,
    rawEffects: RawCardEffect,
    rawRequirements?: any,
    speed: Speed = Speed.ACTION
  ): CardEffect[] {
    const effects: CardEffect[] = [];
    let effectCounter = 0;

    // Parse each effect type in the raw effects object
    for (const [effectType, effectData] of Object.entries(rawEffects)) {
      const effect = this.createCardEffect(
        cardId,
        cardName,
        effectType,
        effectData,
        rawRequirements,
        speed,
        effectCounter++
      );
      effects.push(effect);
    }

    return effects;
  }

  /**
   * Create a single CardEffect from raw data
   */
  private static createCardEffect(
    cardId: string,
    cardName: string,
    effectType: string,
    effectData: any,
    rawRequirements: any,
    speed: Speed,
    index: number
  ): CardEffect {
    // Map effect types to resolvers
    const resolver = this.mapEffectTypeToResolver(effectType);
    
    // Parse requirements
    const requirements = this.parseRequirements(rawRequirements);
    
    // Create effect parameters from the raw data
    const parameters = this.parseEffectParameters(effectType, effectData);

    return {
      id: `${cardId}-effect-${index}`,
      name: `${cardName} - ${this.humanizeEffectType(effectType)}`,
      description: this.generateEffectDescription(effectType, effectData),
      trigger: this.getEffectTrigger(effectType),
      requirements,
      resolver,
      parameters,
      priority: this.getEffectPriority(effectType, speed)
    };
  }

  /**
   * Map Alpha Card effect types to resolver function names
   */
  private static mapEffectTypeToResolver(effectType: string): string {
    const resolverMap: Record<string, string> = {
      // Action card effects
      'dealFireDamage': 'dealFireDamage',
      'weaponBonus': 'weaponBonus',
      'heal': 'heal',
      'grantActions': 'grantActions',
      'immobilize': 'immobilize',
      'drainLife': 'drainLife',
      'searchDeck': 'searchDeck',
      'spellRecall': 'spellRecall',
      'dualShot': 'dualShot',
      'lifeAlchemy': 'lifeAlchemy',
      
      // Counter card effects
      'dramaticReturn': 'dramaticReturn',
      'graverobbing': 'graverobbing',
      'nightmarePain': 'nightmarePain',
      
      // Building effects
      'buildingBonus': 'buildingEffect',
      'territoryControl': 'buildingEffect',
      
      // Equipment effects
      'powerBonus': 'equipmentBonus',
      'statModifier': 'equipmentBonus',
      
      // Role abilities
      'roleAbility': 'roleAbility',
      'passiveBonus': 'roleAbility'
    };

    return resolverMap[effectType] || 'unknown';
  }

  /**
   * Parse card requirements from raw data
   */
  private static parseRequirements(rawRequirements: any): CardRequirements | undefined {
    if (!rawRequirements) {
      return undefined;
    }

    const requirements: CardRequirements = {};

    // Map common requirement types
    if (rawRequirements.controlMagicianFamily) {
      requirements.controlMagicianFamily = true;
    }
    if (rawRequirements.controlWarriorFamily) {
      requirements.controlWarriorFamily = true;
    }
    if (rawRequirements.controlScoutFamily) {
      requirements.controlScoutFamily = true;
    }
    if (rawRequirements.minLevel) {
      requirements.minLevel = rawRequirements.minLevel;
    }
    if (rawRequirements.requiredRoles) {
      requirements.requiredRoles = rawRequirements.requiredRoles;
    }
    if (rawRequirements.boardConditions) {
      requirements.boardConditions = rawRequirements.boardConditions;
    }
    if (rawRequirements.costs) {
      requirements.costs = rawRequirements.costs;
    }

    return Object.keys(requirements).length > 0 ? requirements : undefined;
  }

  /**
   * Parse effect parameters from raw effect data
   */
  private static parseEffectParameters(effectType: string, effectData: any): Record<string, any> {
    const parameters: Record<string, any> = { ...effectData };

    // Add effect type for reference
    parameters.effectType = effectType;

    // Parse common parameter patterns
    if (effectData.targetType) {
      parameters.targetType = effectData.targetType;
    }
    if (effectData.range) {
      parameters.range = effectData.range;
    }
    if (effectData.duration) {
      parameters.duration = effectData.duration;
    }
    if (effectData.power !== undefined) {
      parameters.power = effectData.power;
    }
    if (effectData.extraMovement !== undefined) {
      parameters.extraMovement = effectData.extraMovement;
    }
    if (effectData.extraAttack !== undefined) {
      parameters.extraAttack = effectData.extraAttack;
    }
    if (effectData.healSelf !== undefined) {
      parameters.healSelf = effectData.healSelf;
    }

    return parameters;
  }

  /**
   * Generate human-readable effect description
   */
  private static generateEffectDescription(effectType: string, effectData: any): string {
    const descriptions: Record<string, (data: any) => string> = {
      'dealFireDamage': (data) => `Deal fire damage to ${data.targetType || 'target'}`,
      'weaponBonus': (data) => `Grant +${data.power || 0} weapon power ${data.duration ? 'until ' + data.duration : ''}`,
      'heal': (data) => `Restore HP to ${data.targetType || 'target'}`,
      'grantActions': (data) => `Grant ${data.extraMovement || 0} extra movement and ${data.extraAttack || 0} extra attack`,
      'immobilize': (data) => `Prevent movement and attacks ${data.duration ? 'until ' + data.duration : ''}`,
      'drainLife': (data) => `Deal damage and heal self for same amount`,
      'searchDeck': (data) => `Search deck for quest cards`,
      'spellRecall': (data) => `Return action card from discard to hand`,
      'dualShot': (data) => `Bow attacks hit adjacent targets`,
      'lifeAlchemy': (data) => `Sacrifice summon to heal another`,
      'dramaticReturn': (data) => `Return defeated summon with 10% HP`,
      'graverobbing': (data) => `Steal opponent's summon being destroyed`,
      'nightmarePain': (data) => `Reflect damage as dark magic`
    };

    const generator = descriptions[effectType];
    if (generator) {
      return generator(effectData);
    }

    return `${effectType} effect`;
  }

  /**
   * Get effect trigger timing
   */
  private static getEffectTrigger(effectType: string): string {
    const triggers: Record<string, string> = {
      // Action effects trigger on play
      'dealFireDamage': 'on_play',
      'weaponBonus': 'on_play',
      'heal': 'on_play',
      'grantActions': 'on_play',
      'immobilize': 'on_play',
      'drainLife': 'on_play',
      'searchDeck': 'on_play',
      'spellRecall': 'on_play',
      'dualShot': 'on_play',
      'lifeAlchemy': 'on_play',
      
      // Counter effects trigger on specific conditions
      'dramaticReturn': 'on_summon_defeated',
      'graverobbing': 'on_summon_destroyed',
      'nightmarePain': 'on_warlock_damage',
      
      // Default trigger
      'default': 'on_play'
    };

    return triggers[effectType] || triggers['default'];
  }

  /**
   * Get effect priority for stack resolution
   */
  private static getEffectPriority(effectType: string, speed: Speed): number {
    // Base priority on speed
    let basePriority = 0;
    switch (speed) {
      case Speed.COUNTER:
        basePriority = 300;
        break;
      case Speed.REACTION:
        basePriority = 200;
        break;
      case Speed.ACTION:
        basePriority = 100;
        break;
    }

    // Adjust priority based on effect type
    const priorityAdjustments: Record<string, number> = {
      'dramaticReturn': 50,    // High priority counter
      'graverobbing': 45,      // High priority counter
      'nightmarePain': 40,     // High priority counter
      'dealFireDamage': 10,    // Normal damage
      'drainLife': 15,         // Slightly higher for life steal
      'heal': 5,               // Lower priority for healing
      'immobilize': 20,        // Higher for control effects
      'grantActions': 0,       // Normal priority for buffs
      'weaponBonus': 0         // Normal priority for buffs
    };

    const adjustment = priorityAdjustments[effectType] || 0;
    return basePriority + adjustment;
  }

  /**
   * Convert effect type to human-readable name
   */
  private static humanizeEffectType(effectType: string): string {
    const names: Record<string, string> = {
      'dealFireDamage': 'Fire Damage',
      'weaponBonus': 'Weapon Enhancement',
      'heal': 'Healing',
      'grantActions': 'Action Grant',
      'immobilize': 'Immobilize',
      'drainLife': 'Life Drain',
      'searchDeck': 'Deck Search',
      'spellRecall': 'Spell Recall',
      'dualShot': 'Dual Shot',
      'lifeAlchemy': 'Life Alchemy',
      'dramaticReturn': 'Dramatic Return',
      'graverobbing': 'Graverobbing',
      'nightmarePain': 'Nightmare Pain'
    };

    return names[effectType] || effectType;
  }

  /**
   * Validate parsed card effect
   */
  public static validateCardEffect(effect: CardEffect): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!effect.id) {
      errors.push('Effect ID is required');
    }
    if (!effect.name) {
      errors.push('Effect name is required');
    }
    if (!effect.resolver) {
      errors.push('Effect resolver is required');
    }
    if (!effect.trigger) {
      errors.push('Effect trigger is required');
    }
    if (effect.priority < 0) {
      errors.push('Effect priority must be non-negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse all Alpha Card effects for a complete card
   */
  public static parseCompleteAlphaCard(cardData: {
    id: string;
    name: string;
    effects: RawCardEffect;
    requirements?: any;
    speed?: Speed;
  }): CardEffect[] {
    return this.parseAlphaCardEffects(
      cardData.id,
      cardData.name,
      cardData.effects,
      cardData.requirements,
      cardData.speed || Speed.ACTION
    );
  }
}