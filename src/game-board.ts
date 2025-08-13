import { Position } from './types.js';
import { SummonUnit } from './summon-unit.js';

export class GameBoard {
    public readonly width: number = 14;
    public readonly height: number = 12;
    private units: Map<string, SummonUnit> = new Map();

    constructor() {}

    private getKey(x: number, y: number): string {
        return `${x},${y}`;
    }

    isValidPosition(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getUnitAt(x: number, y: number): SummonUnit | undefined {
        if (!this.isValidPosition(x, y)) return undefined;
        return this.units.get(this.getKey(x, y));
    }

    setUnitAt(x: number, y: number, unit: SummonUnit | undefined): void {
        const key = this.getKey(x, y);
        if (unit) {
            this.units.set(key, unit);
        } else {
            this.units.delete(key);
        }
    }

    moveUnit(unit: SummonUnit, newPosition: Position): boolean {
        if (!this.isValidPosition(newPosition.x, newPosition.y)) return false;
        if (this.getUnitAt(newPosition.x, newPosition.y)) return false; // Position occupied

        // Remove from old position
        this.setUnitAt(unit.position.x, unit.position.y, undefined);
        
        // Update unit position
        unit.position = newPosition;
        
        // Place at new position
        this.setUnitAt(newPosition.x, newPosition.y, unit);
        
        return true;
    }

    placeUnit(unit: SummonUnit, position: Position): boolean {
        if (!this.isValidPosition(position.x, position.y)) return false;
        if (this.getUnitAt(position.x, position.y)) return false; // Position occupied

        unit.position = position;
        this.setUnitAt(position.x, position.y, unit);
        return true;
    }

    removeUnit(unit: SummonUnit): void {
        this.setUnitAt(unit.position.x, unit.position.y, undefined);
    }

    getAllUnits(): SummonUnit[] {
        return Array.from(this.units.values());
    }

    getUnitsInTerritory(playerType: 'A' | 'B'): SummonUnit[] {
        const startRow = playerType === 'A' ? 0 : 9;
        const endRow = playerType === 'A' ? 2 : 11;
        
        const units: SummonUnit[] = [];
        for (let y = startRow; y <= endRow; y++) {
            for (let x = 0; x < this.width; x++) {
                const unit = this.getUnitAt(x, y);
                if (unit) {
                    units.push(unit);
                }
            }
        }
        return units;
    }

    isInTerritory(position: Position, playerType: 'A' | 'B'): boolean {
        const startRow = playerType === 'A' ? 0 : 9;
        const endRow = playerType === 'A' ? 2 : 11;
        return position.y >= startRow && position.y <= endRow;
    }

    getValidMovementPositions(unit: SummonUnit): Position[] {
        const validPositions: Position[] = [];
        const maxMove = unit.remainingMovement;
        
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const position = { x, y };
                // Use Chebyshev distance for diagonal movement
                const distance = Math.max(
                    Math.abs(x - unit.position.x),
                    Math.abs(y - unit.position.y)
                );
                
                if (distance <= maxMove && distance > 0 && !this.getUnitAt(x, y)) {
                    validPositions.push(position);
                }
            }
        }
        
        return validPositions;
    }

    getValidAttackTargets(unit: SummonUnit): SummonUnit[] {
        const targets: SummonUnit[] = [];
        const range = unit.getAttackRange();
        
        for (const targetUnit of this.getAllUnits()) {
            if (targetUnit.owner !== unit.owner) {
                // Use Chebyshev distance for diagonal attacks
                const distance = Math.max(
                    Math.abs(targetUnit.position.x - unit.position.x),
                    Math.abs(targetUnit.position.y - unit.position.y)
                );
                
                if (distance <= range) {
                    targets.push(targetUnit);
                }
            }
        }
        
        return targets;
    }

    getTerritoryType(_x: number, y: number): 'player-a' | 'player-b' | 'neutral' {
        if (y <= 2) return 'player-a';
        if (y >= 9) return 'player-b';
        return 'neutral';
    }
}