export function rollDice() {
    return Math.floor(Math.random() * 10) + 1;
  }
  
  export function determineAttackType(roll) {
    if (roll >= 1 && roll <= 3) return "Basic Attack";
    if (roll >= 4 && roll <= 5) return "Critical Attack";
    return "Special Attack";
  }
  
  export function getSpecialAttack() {
    const specialAttacks = [
      { name: "Spam Punch", multiplier: [2, 4], base: 0.7 },
      { name: "Flaming Bonk", multiplier: [1.7, 2.2] },
      { name: "Maldquake", selfDamageMultiplier: 0.6, opponentDamageMultiplier: 2.4 },
      { name: "Delulu Strike", effect: "Redirect opponent's next attack" }
    ];
    
    return specialAttacks[Math.floor(Math.random() * specialAttacks.length)];
  }
  
  export function getDefenseSkill() {
    const defenseSkills = [
      { name: "Gyatt Harden", damageReduction: 0.7 },
      { name: "Self-Care Arc", heal: [300, 500] },
      { name: "Zucc", effect: "Redirect opponent's defense skill" }
    ];
  
    return defenseSkills[Math.floor(Math.random() * defenseSkills.length)];
  }
  
  export function calculateDamage(attacker, defender, attackType) {
    let damage = attacker.attack;
  
    if (attackType === "Critical Attack") {
      damage *= attacker.critRate; // Use critRate from battlers.json
    } else if (attackType === "Special Attack") {
      const skill = getSpecialAttack();
      
      // Handle different types of special attacks
      if (skill.base) {
        damage *= skill.base;
      } else if (skill.multiplier) {
        const multiplierValue = Math.random() * (skill.multiplier[1] - skill.multiplier[0]) + skill.multiplier[0];
        damage *= multiplierValue;
      } else if (skill.name === "Maldquake") {
        // Special handling for Maldquake
        // This is a special case that needs to be handled in the BattleStage component
        // since it affects both battlers
        damage *= skill.opponentDamageMultiplier;
      }
    }
  
    return Math.floor(damage); // Round damage to avoid decimals
  }
  
  // New function to handle Maldquake's self-damage calculation
  export function calculateSelfDamage(attacker, attackType) {
    if (attackType !== "Special Attack") return 0;
    
    const skill = getSpecialAttack();
    if (skill.name !== "Maldquake") return 0;
    
    // Calculate self-damage for Maldquake
    const selfDamage = Math.floor(attacker.attack * skill.selfDamageMultiplier);
    return selfDamage;
  }