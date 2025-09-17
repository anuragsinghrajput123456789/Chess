const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const exp = require("constants");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);
const chess = new Chess();
let players = {};
let currentPlayer = "w";
let score = { w: 0, b: 0 };
let capturedPieces = { w: [], b: [] };
const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };

app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "public")))

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", (uniquesocket) => {
  console.log("connected");

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b")
  } else {
    uniquesocket.emit("spectatorRole")
  }

  uniquesocket.on("disconnect", () => {
    if (uniquesocket.id === players.white) {
      delete players.white;
    } else if (uniquesocket.id === players.black) {
      delete players.black;
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
      if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        if (result.captured) {
          const capturedPiece = { type: result.captured, color: result.color === 'w' ? 'b' : 'w' };
          if (result.color === 'w') {
            score.w += pieceValues[capturedPiece.type];
            capturedPieces.w.push(capturedPiece);
          } else {
            score.b += pieceValues[capturedPiece.type];
            capturedPieces.b.push(capturedPiece);
          }
          io.emit("gameStateUpdate", { score, capturedPieces });
        }
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log(`Invalid move : `,move)
        uniquesocket.emit(`InvalidMove`,move)
      }
    } catch (err) {
      console.log(err)
      uniquesocket.emit("Invalid move : ",move)
    }
  });
});

server.listen(3000, () => {
  console.log("listening on post 3000");
});
