import React from "react";

const players = [
  {
    name: "Player 1",
    score: 200,
    avatar: "/avatars/player1.png",
    country: "",
  },
  {
    name: "Player 2",
    score: 152,
    avatar: "/avatars/player2.png",
    country: "",
  },
  {
    name: "Player 3",
    score: 104,
    avatar: "/avatars/player3.png",
    country: "",
  },
];

const Leaderboard = () => {
  return (
    <div className="leaderboard">
      {players.map((player, index) => (
        <div key={index} className="player">
          <img src={player.avatar} alt={`${player.name} avatar`} />
          <span>
            {player.country} {player.name}
          </span>
          <span className="score">{player.score} pts</span>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;
