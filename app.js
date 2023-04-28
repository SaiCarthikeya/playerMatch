const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running!!");
    });
  } catch (e) {
    console.log(`Error ${e}`);
  }
};

initializeDbAndServer();

const convertPlayers = (dbResponse) => {
  return {
    playerId: dbResponse.player_id,
    playerName: dbResponse.player_name,
  };
};

const convertMatch = (dbResponse) => {
  return {
    matchId: dbResponse.match_id,
    match: dbResponse.match,
    year: dbResponse.year,
  };
};

const convertScores = (dbResponse) => {
  return {
    playerId: dbResponse.player_id,
    playerName: dbResponse.player_name,
    totalScore: dbResponse.score,
    totalFours: dbResponse.fours,
    totalSixes: dbResponse.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details ORDER BY player_id;`;
  const dbResponse = await db.all(getPlayersQuery);
  response.send(dbResponse.map(convertPlayers));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const dbResponse = await db.get(getPlayerQuery);
  response.send(convertPlayers(dbResponse));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerName = request.body.playerName;
  const getPlayerQuery = `UPDATE player_details SET (player_name) VALUES ('${playerName}') WHERE player_id = ${playerId};`;
  const dbResponse = await db.run(getPlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const dbResponse = await db.get(getMatchQuery);
  response.send(convertMatch(dbResponse));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatches = `SELECT * FROM  Match_Details
  INNER JOIN Player_Match_Score ON Match_Details.match_id = Player_Match_Score.match_id
     WHERE player_id = ${playerId};`;
  const dbResponse = await db.all(getMatches);
  response.send(dbResponse.map(convertMatch));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatches = `SELECT * FROM  player_details
  INNER JOIN Player_Match_Score ON player_Details.player_id = Player_Match_Score.player_id
     WHERE match_id = ${matchId};`;
  const dbResponse = await db.all(getMatches);
  response.send(dbResponse.map(convertPlayers));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `
    SELECT 
        pd.player_id,
        pd.player_name,
        SUM(pms.score) as score,
        SUM(pms.fours) as fours,
        SUM(pms.sixes) as sixes
    FROM 
        Player_Details pd 
        INNER JOIN Player_Match_Score pms ON pd.player_id = pms.player_id
    WHERE 
        pd.player_id = ${playerId}
    GROUP BY 
        pd.player_id,
        pd.player_name;
  `;
  const dbResponse = await db.get(query);
  response.send(convertScores(dbResponse));
});

module.exports = app;
