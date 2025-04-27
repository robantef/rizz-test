import React, { useState, useEffect, useRef } from "react";
import "./BattleStage.css";
import {
  rollDice,
  determineAttackType,
  getSpecialAttack,
  calculateDamage,
  calculateSelfDamage,
} from "../utils/battleLogic";
import { saveToFile } from "../utils/fileUtils";

// Define props for BattleStage
interface BattleStageProps {
  battlers: {
    name: string;
    level: number;
    hp: number;
    attack: number;
    critRate: number;
    image: string;
  }[];
  closeStage: () => void;
  simulationNumber?: number; // Optional prop for tracking simulation number
}

interface BattleLogEntry {
  turn: number;
  attacker: string;
  defender: string;
  attackType: string;
  specialAttackName?: string;
  damage: number;
  selfDamage?: number;
  defenderHpBefore: number;
  defenderHpAfter: number;
  attackerHpBefore?: number;
  attackerHpAfter?: number;
}

const BattleStage: React.FC<BattleStageProps> = ({
  battlers,
  closeStage,
  simulationNumber = 1, // Default to 1 if not provided
}) => {
  const [battleStarted, setBattleStarted] = useState(false);
  const [battleText, setBattleText] = useState("Battle starting...");
  const [hp, setHp] = useState(battlers.map((b) => b.hp)); // Store initial HP
  const [turnCount, setTurnCount] = useState(0); // Track turns
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const [battleOver, setBattleOver] = useState(false);
  let [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const battleLogRef = useRef<BattleLogEntry[]>([]);

  // Function to generate battle log text
  const generateBattleLogText = () => {
    let logText = `Simulation ${simulationNumber}\n`;
    logText += `Battle Start!\n`;
    logText += `${battlers[0].name}: ${battlers[0].hp} HP\n`;
    logText += `${battlers[1].name}: ${battlers[1].hp} HP\n`;

    battleLogRef.current.forEach((entry) => {
      logText += `Turn: ${entry.attacker}\n`;

      if (entry.attackType === "Special Attack") {
        const skillNumber = Math.floor(Math.random() * 5) + 1;
        logText += `[${entry.attacker}] Special Skill #${skillNumber}\n`;

        if (entry.specialAttackName === "Maldquake") {
          // Special handling for Maldquake
          logText += `${entry.attacker} uses Maldquake!\n`;

          // Log self-damage
          if (
            entry.selfDamage &&
            entry.attackerHpBefore !== undefined &&
            entry.attackerHpAfter !== undefined
          ) {
            logText += `${entry.attacker} took ${entry.selfDamage} self-damage. HP: ${entry.attackerHpBefore} > ${entry.attackerHpAfter}\n`;
          }

          // Log damage to opponent
          logText += `${entry.defender} took ${entry.damage} damage. HP: ${entry.defenderHpBefore} > ${entry.defenderHpAfter}\n`;
        } else if (
          entry.specialAttackName &&
          entry.specialAttackName.includes("Strike")
        ) {
          logText += `${entry.attacker} is now using ${entry.specialAttackName}! Redirect opponent's next attack.\n`;
        } else {
          // Other special attacks
          logText += `${entry.attacker} attacks with ${
            entry.specialAttackName || "Special Attack"
          } for ${entry.damage} damage\n`;
          logText += `Target took ${entry.damage} damage. HP: ${entry.defenderHpBefore} > ${entry.defenderHpAfter}\n`;
        }
      } else if (entry.attackType === "Critical Attack") {
        logText += `[${entry.attacker}] Critical Attack\n`;
        logText += `${entry.attacker} attacks for ${entry.damage} damage (CRITICAL!)\n`;
        logText += `Target took ${entry.damage} damage. HP: ${entry.defenderHpBefore} > ${entry.defenderHpAfter}\n`;
      } else {
        logText += `[${entry.attacker}] Basic Attack\n`;
        logText += `${entry.attacker} attacks for ${entry.damage} damage\n`;
        logText += `Target took ${entry.damage} damage. HP: ${entry.defenderHpBefore} > ${entry.defenderHpAfter}\n`;
      }
    });

    logText += `Battle Over!\n`;

    // Use the winnerIndex to set the loser's HP to exactly 0
    let finalHP = [...hp];

    const loserIndex = winnerIndex === 0 ? 1 : 0;
    finalHP[loserIndex] = 0; // Ensure loser always has 0 HP

    if (loserIndex !== null) {
      winnerIndex = loserIndex === 0 ? 1 : 0; // Set winner as the opposite of loser
      setWinnerIndex(winnerIndex); // Ensure state updates correctly
    }
    if (winnerIndex !== null && battlers[winnerIndex]) {
      logText += `${battlers[winnerIndex].name}: ${finalHP[winnerIndex]} HP\n`;
    } else {
      console.error("Winner index is null or invalid, check loserIndex.");
    }
    logText += `${battlers[loserIndex].name}: 0 HP\n`; // Print loser HP correctly

    return logText;
  };

  // Save battle log to file in ../logs directory
  const saveBattleLog = () => {
    const logText = generateBattleLogText();
    const filePath = `../logs/battle${simulationNumber}.txt`;
    saveToFile(filePath, logText);
  };

  // Process a battle turn and return if battle should end
  const processTurn = () => {
    const attackerIndex = turnCount % 2; // Alternate between 0 and 1
    const defenderIndex = attackerIndex === 0 ? 1 : 0;

    const diceRoll = rollDice();
    const attackType = determineAttackType(diceRoll);
    const specialAttack =
      attackType === "Special Attack" ? getSpecialAttack() : null;

    const damage = calculateDamage(
      battlers[attackerIndex],
      battlers[defenderIndex],
      attackType
    );

    // Calculate self-damage for Maldquake
    let selfDamage = 0;
    let attackerHpBefore = hp[attackerIndex];
    let attackerHpAfter = attackerHpBefore;

    if (specialAttack && specialAttack.name === "Maldquake") {
      selfDamage = Math.floor(battlers[attackerIndex].attack * 0.6);
      attackerHpAfter = Math.max(0, attackerHpBefore - selfDamage);
    }

    // Record this turn in battle log before updating HP
    const defenderHpBefore = hp[defenderIndex];
    const defenderHpAfter = Math.max(0, defenderHpBefore - damage);

    // Create log entry for this turn
    const logEntry: BattleLogEntry = {
      turn: turnCount + 1,
      attacker: battlers[attackerIndex].name,
      defender: battlers[defenderIndex].name,
      attackType,
      specialAttackName: specialAttack?.name,
      damage,
      defenderHpBefore,
      defenderHpAfter,
    };

    // Add self-damage info for Maldquake
    if (specialAttack && specialAttack.name === "Maldquake") {
      logEntry.selfDamage = selfDamage;
      logEntry.attackerHpBefore = attackerHpBefore;
      logEntry.attackerHpAfter = attackerHpAfter;
    }

    // Update our ref and state for battle log
    battleLogRef.current = [...battleLogRef.current, logEntry];
    setBattleLog([...battleLogRef.current]);

    // Update HP for both battlers (needed for Maldquake)
    setHp((prevHp) => {
      const newHp = [...prevHp];
      // Update defender's HP
      newHp[defenderIndex] = defenderHpAfter;

      // For Maldquake, also update attacker's HP
      if (specialAttack && specialAttack.name === "Maldquake") {
        newHp[attackerIndex] = attackerHpAfter;
      }

      return newHp;
    });

    // Set battle text based on attack type
    if (attackType === "Special Attack") {
      if (specialAttack?.name === "Maldquake") {
        setBattleText(
          `${battlers[attackerIndex].name} uses Maldquake! Takes ${selfDamage} damage and deals ${damage} damage!`
        );
      } else {
        setBattleText(
          `${battlers[attackerIndex].name} uses ${
            specialAttack?.name || "Special Attack"
          }!`
        );
      }
    } else {
      setBattleText(
        `${battlers[attackerIndex].name} performs a ${attackType}!`
      );
    }

    // Increment turn counter
    setTurnCount(turnCount + 1);

    // Check if this turn ended the battle
    // Both battlers could potentially reach 0 HP if attacker uses Maldquake
    let battleEnded = false;
    let winner = null;

    if (defenderHpAfter <= 0 && attackerHpAfter <= 0) {
      // Both died - draw (can happen with Maldquake)
      battleEnded = true;
    } else if (defenderHpAfter <= 0) {
      // Defender died
      battleEnded = true;
      winner = attackerIndex;
    } else if (attackerHpAfter <= 0) {
      // Attacker died (from Maldquake self-damage)
      battleEnded = true;
      winner = defenderIndex;
    }

    if (winner !== null) {
      setWinnerIndex(winner);
    }

    return {
      ended: battleEnded,
      winner,
      isDraw: battleEnded && winner === null,
    };
  };

  useEffect(() => {
    // Initialize battle
    setTimeout(() => setBattleStarted(true), 2000); // Start battle after 2s

    const turnInterval = setInterval(() => {
      if (!battleStarted || battleOver) {
        return;
      }

      // Process turn and get result
      const result = processTurn();

      // Check if battle is over AFTER processing the turn
      if (result.ended) {
        if (result.isDraw) {
          // Handle draw
          setTimeout(() => {
            setBattleText("Battle ends in a draw!");
            setBattleOver(true);

            // Save battle log when battle ends
            setTimeout(saveBattleLog, 500);
          }, 100);
        } else if (result.winner !== null) {
          // Handle winner
          const winner = battlers[result.winner].name;

          setTimeout(() => {
            setBattleText(`${winner} wins the battle!`);
            setBattleOver(true);

            // Save battle log when battle ends
            setTimeout(saveBattleLog, 500);
          }, 100);
        }

        clearInterval(turnInterval);
      }
    }, 2000);

    return () => clearInterval(turnInterval);
  }, [battleStarted, battleOver, turnCount, battlers]);

  return (
    <div className="battle-stage">
      <button className="close-btn" onClick={closeStage}>
        Exit Battle
      </button>
      <img
        className="background"
        src="/images/battle-bg.png"
        alt="Battle Background"
      />

      {/* Display battle action */}
      <div className="battle-text">{battleText}</div>

      {/* Display battler stats */}
      <div className="battler-info">
        {battlers.map((battler, index) => (
          <div key={index} className="battler-card">
            <h2>
              {battler.name} (LV {battler.level})
            </h2>
            <p>HP: {hp[index]}</p>
            <p>Attack: {battler.attack}</p>
          </div>
        ))}
      </div>

      {/* Show battler images */}
      <div className="battle-stage-images">
        {battlers.map((battler, index) => (
          <img
            key={index}
            className={`battler ${index === 1 ? "enemy" : ""}`}
            src={battler.image}
            alt={battler.name}
          />
        ))}
      </div>
    </div>
  );
};

export default BattleStage;
