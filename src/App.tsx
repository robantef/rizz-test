import React, { useState, useEffect } from "react";
import Leaderboard from "./components/Leaderboard";
import BattleStage from "./components/BattleStage";
import "./App.css";

function App() {
  const [isBattleActive, setBattleActive] = useState(false);
  const [battlers, setBattlers] = useState([]);

  // Fetch battlers from JSON or API
  useEffect(() => {
    fetch("/data/battlers.json") // Adjust path based on location
      .then((res) => res.json())
      .then((data) => setBattlers(data));
  }, []);

  return (
    <div className="App">
      {!isBattleActive ? (
        <div className="idle-screen">
          <h1>Auto-Battle Leaderboard</h1>
          <Leaderboard />
          <button onClick={() => setBattleActive(true)}>Start Battle</button>
        </div>
      ) : (
        <BattleStage
          battlers={battlers}
          closeStage={() => setBattleActive(false)}
        />
      )}
    </div>
  );
}

export default App;
