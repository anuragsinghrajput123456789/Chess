const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let lastMove = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  updateGameInfo();
  board.forEach((row, rowindex) => {
    row.forEach((square, squareindex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowindex;
      squareElement.dataset.col = squareindex;

      if (lastMove && (lastMove.from === `${String.fromCharCode(97 + squareindex)}${8 - rowindex}` || lastMove.to === `${String.fromCharCode(97 + squareindex)}${8 - rowindex}`)) {
        squareElement.classList.add("last-move");
      }

      if (chess.in_check() && square && square.type === 'k' && square.color === chess.turn()) {
        squareElement.classList.add("in-check");
      }

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerHTML = getPieceSvg(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowindex, col: squareindex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSource = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };

          handleMove(sourceSquare, targetSource);
        }
      });
      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === 'b') {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: `q`,
  };

  const result = chess.move(move); // Validate the move
  if (result) {
    socket.emit("move", move); // Only emit if valid
  } else {
    console.error("Invalid move");
  }
};

const getPieceSvg = (piece) => {
    const svgPieces = {
        w: {
            p: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill-rule="evenodd"/></g></svg>',
            r: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/><path d="M34 14l-3 3H14l-3-3" stroke-linecap="butt"/><path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5" stroke-linecap="butt"/><path d="M14 17h17" fill="none" stroke-linejoin="miter"/></g></svg>',
            n: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c1.32-.52 2.18-1.94 2-3.36-.2-1.54-1.63-2.64-3-2.64-1.37 0-2.5.9-3 2.22l.23 1.42c.06.37.23.72.5 1.03.26.3.57.53.93.67l-2.4 2.36-2.2-2.9c-.83-1.1-2.1-1.7-3.4-1.7-1.3 0-2.6.6-3.4 1.7L4.5 15.5c-.8 1-1.2 2.3-1.2 3.6 0 1.3.4 2.6 1.2 3.6l2.9 3.7-2.3 2.3c-.3.3-.5.6-.6 1 0 .4.1.8.4 1.1l2.3 2.3c.3.3.7.4 1 .4.4 0 .8-.1 1.1-.4l2.3-2.3 3.7 2.9c1 .8 2.3 1.2 3.6 1.2 1.3 0 2.6-.4 3.6-1.2l3.7-2.9 2.3 2.3c.3.3.7.4 1 .4.4 0 .8-.1 1.1-.4l2.3-2.3c.3-.3.4-.7.4-1.1 0-.4-.1-.8-.4-1.1l-2.3-2.3 2.9-3.7c.8-1 1.2-2.3 1.2-3.6 0-1.3-.4-2.6-1.2-3.6L28.1 8.8c-.8-1.1-2.1-1.7-3.4-1.7-1.3 0-2.6.6-3.4 1.7l-2.2 2.9-2.4-2.3c.36-.14.67-.37.93-.67.27-.31.44-.66.5-1.03l.23-1.42z" fill-rule="evenodd"/></g></svg>',
            b: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 1 2.47C36.5 40.48 32.5 42 22.5 42S8.5 40.48 8 38.47C7.35 36.54 9 36 9 36z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5-5.5 2.5-11.5-1.5-15.5-2-2-4-2.5-4-2.5s-2 .5-4 2.5c-4 4-6.5 10-1.5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g></svg>',
            q: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z"/><path d="M11.5 14.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5c0 2.5-2 4.5-4.5 4.5s-4.5-2-4.5-4.5zM22.5 14.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5c0 2.5-2 4.5-4.5 4.5s-4.5-2-4.5-4.5zM33.5 14.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5c0 2.5-2 4.5-4.5 4.5s-4.5-2-4.5-4.5z"/><path d="M11.5 29.5v-15h22v15H11.5z" stroke-linecap="butt"/><path d="M11.5 29.5l-2 4.5h26l-2-4.5H11.5z" stroke-linecap="butt"/></g></svg>',
            k: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" fill="none" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c-1.5-3-7.5-1.5-6 0 1.5 1.5 3 10.5 3 10.5" fill-rule="evenodd" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M12.5 37l4.5-10.5-3-2 4.5-4.5-3-2 4-3.5 4.5 3-3 2 4.5 4-3.5 2 5.5 11H12.5z" fill-rule="evenodd"/><path d="M12.5 37l4.5-10.5-3-2 4.5-4.5-3-2 4-3.5 4.5 3-3 2 4.5 4-3.5 2 5.5 11z" fill="none"/><path d="M22.5 25l-1-4" fill="none"/><path d="M22.5 25l1-4" fill="none"/><path d="M22.5 25l-1.5-6" fill="none"/><path d="M22.5 25l1.5-6" fill="none"/><path d="M20 8s-1.5-1.5-1.5-3 1.5-3 1.5-3" fill="none"/><path d="M25 8s1.5-1.5 1.5-3-1.5-3-1.5-3" fill="none"/></g></svg>',
        },
        b: {
            p: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill-rule="evenodd"/></g></svg>',
            r: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/><path d="M34 14l-3 3H14l-3-3" stroke-linecap="butt"/><path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5" stroke-linecap="butt"/><path d="M14 17h17" fill="none" stroke-linejoin="miter"/></g></svg>',
            n: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c1.32-.52 2.18-1.94 2-3.36-.2-1.54-1.63-2.64-3-2.64-1.37 0-2.5.9-3 2.22l.23 1.42c.06.37.23.72.5 1.03.26.3.57.53.93.67l-2.4 2.36-2.2-2.9c-.83-1.1-2.1-1.7-3.4-1.7-1.3 0-2.6.6-3.4 1.7L4.5 15.5c-.8 1-1.2 2.3-1.2 3.6 0 1.3.4 2.6 1.2 3.6l2.9 3.7-2.3 2.3c-.3.3-.5.6-.6 1 0 .4.1.8.4 1.1l2.3 2.3c.3.3.7.4 1 .4.4 0 .8-.1 1.1-.4l2.3-2.3 3.7 2.9c1 .8 2.3 1.2 3.6 1.2 1.3 0 2.6-.4 3.6-1.2l3.7-2.9 2.3 2.3c.3.3.7.4 1 .4.4 0 .8-.1 1.1-.4l2.3-2.3c.3-.3.4-.7.4-1.1 0-.4-.1-.8-.4-1.1l-2.3-2.3 2.9-3.7c.8-1 1.2-2.3 1.2-3.6 0-1.3-.4-2.6-1.2-3.6L28.1 8.8c-.8-1.1-2.1-1.7-3.4-1.7-1.3 0-2.6.6-3.4 1.7l-2.2 2.9-2.4-2.3c.36-.14.67-.37.93-.67.27-.31.44-.66.5-1.03l.23-1.42z" fill-rule="evenodd"/></g></svg>',
            b: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 1 2.47C36.5 40.48 32.5 42 22.5 42S8.5 40.48 8 38.47C7.35 36.54 9 36 9 36z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5-5.5 2.5-11.5-1.5-15.5-2-2-4-2.5-4-2.5s-2 .5-4 2.5c-4 4-6.5 10-1.5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g></svg>',
            q: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z"/><path d="M11.5 14.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5c0 2.5-2 4.5-4.5 4.5s-4.5-2-4.5-4.5zM22.5 14.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5c0 2.5-2 4.5-4.5 4.5s-4.5-2-4.5-4.5zM33.5 14.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5c0 2.5-2 4.5-4.5 4.5s-4.5-2-4.5-4.5z"/><path d="M11.5 29.5v-15h22v15H11.5z" stroke-linecap="butt"/><path d="M11.5 29.5l-2 4.5h26l-2-4.5H11.5z" stroke-linecap="butt"/></g></svg>',
            k: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" fill="none" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c-1.5-3-7.5-1.5-6 0 1.5 1.5 3 10.5 3 10.5" fill-rule="evenodd" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M12.5 37l4.5-10.5-3-2 4.5-4.5-3-2 4-3.5 4.5 3-3 2 4.5 4-3.5 2 5.5 11H12.5z" fill-rule="evenodd"/><path d="M12.5 37l4.5-10.5-3-2 4.5-4.5-3-2 4-3.5 4.5 3-3 2 4.5 4-3.5 2 5.5 11z" fill="none"/><path d="M22.5 25l-1-4" fill="none"/><path d="M22.5 25l1-4" fill="none"/><path d="M22.5 25l-1.5-6" fill="none"/><path d="M22.5 25l1.5-6" fill="none"/><path d="M20 8s-1.5-1.5-1.5-3 1.5-3 1.5-3" fill="none"/><path d="M25 8s1.5-1.5 1.5-3-1.5-3-1.5-3" fill="none"/></g></svg>',
        }
    };
    return svgPieces[piece.color][piece.type] || "";
};

const updateGameInfo = () => {
  const playerRoleElement = document.getElementById("player-role");
  const currentTurnElement = document.getElementById("current-turn");

  playerRoleElement.textContent = playerRole ? (playerRole === 'w' ? 'White' : 'Black') : 'Spectator';
  currentTurnElement.textContent = chess.turn() === 'w' ? 'White' : 'Black';
};

socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  lastMove = move;
  chess.move(move);
  renderBoard();
});

socket.on("gameStateUpdate", (gameState) => {
    document.getElementById("white-score").textContent = gameState.score.w;
    document.getElementById("black-score").textContent = gameState.score.b;

    const whiteCapturedPiecesElement = document.getElementById("white-captured-pieces");
    const blackCapturedPiecesElement = document.getElementById("black-captured-pieces");

    whiteCapturedPiecesElement.innerHTML = gameState.capturedPieces.w.map(p => getPieceSvg(p)).join(" ");
    blackCapturedPiecesElement.innerHTML = gameState.capturedPieces.b.map(p => getPieceSvg(p)).join(" ");
});

renderBoard();
