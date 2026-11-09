(() => {
  const root = document.getElementById("opening-training");
  if (!root) return;
  const boardEl = root.querySelector("#training-board");
  const statusEl = root.querySelector("#training-status");
  const progressEl = root.querySelector("#training-progress");
  const modeEl = root.querySelector("#training-mode");
  const gameEl = root.querySelector("#training-game");
  const sideEl = root.querySelector("#training-side");
  const hintEl = root.querySelector("#training-hint");
  const nextEl = root.querySelector("#training-next");
  const resetEl = root.querySelector("#training-reset");
  if (!window.Chess) {
    statusEl.textContent = "The chessboard could not load. Please refresh the page and try again.";
    return;
  }

  const games = [
    { name: "Ahmed Dabo vs Leonel Mbaho · Tactical awareness", moves: ["g3","c5","Bg2","Nc6","c4","g6","Nc3","Bg7","Bxc6","dxc6","Ne4","Nf6","Nxc5","O-O","Nf3","Bh3","Ng5","Bg2","Rg1","h6","Rxg2","hxg5","d4","b6","Nd3","Qxd4","Bxg5","Rad8","Be3","Qxc4","b3","Ne4","bxc4","Bxa1","Qxa1","c5","Bh6"] },
    { name: "Ahmed Dabo · Space vs development", moves: ["g3","d5","d4","Bg4","f3","Bh5","g4","Bg6","h4","h6","h5","Bh7","Bf4","c5","Nd2","Nc6","c3","Nf6","Qa4","Qb6","b3","cxd4","cxd4","Qxd4","Qxd4","Nxd4","Be3","e5","Rc1","Nc2+","Kf2","Rc8","Bxa7","d4","Bg2","Ba3","Rd1","Ne3","Re1","Nxg2","Kxg2","Rc1","Rxc1","Bxc1","Nc4","Ne7","Nh3","Be3","Nd6+","Kd7","Nxb7","Ra8","Nc5+","Kc7","Ne6+","Kb7","Bc5","Rxa2","Bxe7","Rxe2+","Kf1","Bd3","Nc5+","Kc6","Nxd3","Ra2","Nb4+"] },
    { name: "Ahmed Dabo vs Leonel Mbaho · Positional pressure", moves: ["c4","f5","g3","Nf6","Bg2","e6","Nc3","Bd6","Nb5","Bc5","d4","Bb6","Bd2","a6","c5","Ba7","Nc3","O-O","Bg5","d6","d5","Bxc5","dxe6","Bxe6","Bxb7","Ra7","Bg2","c6","a3","Qa5","Nh3","Qb6","b4","Bd4","Na4","Qb5","Qxd4","Qxa4","O-O","Rd7","Nf4","c5","Qe3","Bb3","Rab1","c4","Bxf6","Rxf6","Qe8+","Rf8"] }
  ];
  const glyph = { wk:"♔", wq:"♕", wr:"♖", wb:"♗", wn:"♘", wp:"♙", bk:"♚", bq:"♛", br:"♜", bb:"♝", bn:"♞", bp:"♟" };
  let chess = new Chess();
  let selected = null;
  let targets = [];
  let mode = "opening";
  let userColor = "w";
  let activeGame = games[0];
  let ply = 0;
  let mistakes = 0;
  let puzzleList = [];
  let puzzleIndex = 0;
  let puzzleSolved = false;
  const stripSan = san => san.replace(/[+#?!]+$/g, "");

  function showStatus(message, kind) {
    statusEl.textContent = message;
    statusEl.dataset.kind = kind || "info";
  }

  function renderBoard() {
    boardEl.replaceChildren();
    const board = chess.board();
    const ranks = userColor === "w" ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
    const files = userColor === "w" ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
    ranks.forEach(rank => files.forEach(file => {
      const sq = String.fromCharCode(97 + file) + String(rank + 1);
      const piece = board[rank][file];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "training-square " + ((rank + file) % 2 ? "dark" : "light");
      button.dataset.square = sq;
      button.setAttribute("aria-label", (piece ? (piece.color === "w" ? "White " : "Black ") + ({k:"king",q:"queen",r:"rook",b:"bishop",n:"knight",p:"pawn"}[piece.type]) : "Empty") + " " + sq);
      if (piece) {
        const key = piece.color + piece.type;
        button.textContent = glyph[key];
        button.classList.add(piece.color === "w" ? "white-piece" : "black-piece");
      }
      if (selected === sq) button.classList.add("selected");
      if (targets.includes(sq)) button.classList.add("legal-target");
      button.addEventListener("click", () => onSquare(sq));
      boardEl.append(button);
    }));
  }

  function expectedMove() {
    if (mode === "opening") {
      const san = activeGame.moves[ply];
      if (!san) return null;
      const options = chess.moves({ verbose: true });
      return options.find(move => stripSan(move.san) === stripSan(san)) || null;
    }
    return puzzleList[puzzleIndex]?.move || null;
  }

  function onSquare(square) {
    if (puzzleSolved || (mode === "opening" && chess.turn() !== userColor)) return;
    const piece = chess.get(square);
    if (!selected) {
      if (!piece || piece.color !== chess.turn()) return;
      selected = square;
      targets = chess.moves({ square, verbose: true }).map(move => move.to);
      renderBoard();
      return;
    }
    if (square === selected) {
      selected = null; targets = []; renderBoard(); return;
    }
    const candidate = chess.moves({ square: selected, verbose: true }).find(move => move.to === square);
    if (!candidate) {
      if (piece && piece.color === chess.turn()) {
        selected = square;
        targets = chess.moves({ square, verbose: true }).map(move => move.to);
      } else {
        selected = null; targets = [];
      }
      renderBoard();
      return;
    }
    const answer = expectedMove();
    const isCorrect = answer && candidate.from === answer.from && candidate.to === answer.to && (candidate.promotion || "") === (answer.promotion || "");
    if (!isCorrect) {
      mistakes++;
      selected = null; targets = [];
      renderBoard();
      showStatus(mistakes >= 2 && answer ? "Not quite. Hint: " + answer.san : "Not that move. Try again.", "retry");
      return;
    }
    chess.move({ from: candidate.from, to: candidate.to, promotion: candidate.promotion || "q" });
    selected = null; targets = [];
    if (mode === "opening") {
      ply++;
      while (ply < 24 && ply < activeGame.moves.length && chess.turn() !== userColor) {
        chess.move(activeGame.moves[ply]);
        ply++;
      }
      renderBoard();
      const completed = ply >= 24 || ply >= activeGame.moves.length;
      progressEl.textContent = completed ? "Opening line complete" : "Move " + (Math.floor(ply / 2) + 1) + " · " + (userColor === "w" ? "White" : "Black") + " to play";
      showStatus(completed ? "Line complete. Reset to practise it again." : "Correct. Your move.", completed ? "success" : "success");
      if (completed) puzzleSolved = true;
    } else {
      puzzleSolved = true;
      renderBoard();
      progressEl.textContent = "Middlegame position " + (puzzleIndex + 1) + " of " + puzzleList.length;
      showStatus("Correct — " + answer.san + " was played in the game.", "success");
      nextEl.hidden = false;
    }
  }

  function startOpening() {
    chess = new Chess();
    selected = null; targets = []; mistakes = 0; puzzleSolved = false; nextEl.hidden = true;
    if (userColor === "b" && activeGame.moves.length) {
      chess.move(activeGame.moves[0]);
      ply = 1;
    } else ply = 0;
    progressEl.textContent = "Move 1 · " + (userColor === "w" ? "White" : "Black") + " to play";
    renderBoard();
    showStatus("Play the moves from the game. The opponent’s replies will appear automatically.", "info");
  }

  function makePuzzles() {
    const selectedGame = games[Number(gameEl.value)] || games[0];
    const state = new Chess();
    const puzzles = [];
    for (let index = 0; index < selectedGame.moves.length; index++) {
      if (index >= 20 && state.turn() === userColor) {
        const choices = state.moves({ verbose: true });
        const san = selectedGame.moves[index];
        const answer = choices.find(move => stripSan(move.san) === stripSan(san));
        if (answer) puzzles.push({ fen: state.fen(), san, move: answer, number: Math.floor(index / 2) + 1 });
      }
      try { state.move(selectedGame.moves[index]); } catch (_) { break; }
    }
    return puzzles;
  }

  function startMiddlegame() {
    activeGame = games[Number(gameEl.value)] || games[0];
    puzzleList = makePuzzles();
    if (!puzzleList.length) {
      showStatus("There are no middlegame positions for that side in this game yet.", "info");
      return;
    }
    puzzleIndex = Math.floor(Math.random() * puzzleList.length);
    loadPuzzle();
  }

  function loadPuzzle() {
    const puzzle = puzzleList[puzzleIndex];
    chess = new Chess(puzzle.fen);
    selected = null; targets = []; mistakes = 0; puzzleSolved = false; nextEl.hidden = true; hintEl.hidden = true;
    renderBoard();
    progressEl.textContent = "Move " + puzzle.number + " · " + (userColor === "w" ? "White" : "Black") + " to play";
    showStatus("Find the move played in the RBKC game.", "info");
  }

  function start() {
    activeGame = games[Number(gameEl.value)] || games[0];
    mode = modeEl.value;
    userColor = sideEl.value;
    if (mode === "opening") startOpening();
    else startMiddlegame();
  }

  modeEl.addEventListener("change", start);
  gameEl.addEventListener("change", start);
  sideEl.addEventListener("change", start);
  resetEl.addEventListener("click", start);
  nextEl.addEventListener("click", () => {
    puzzleIndex = (puzzleIndex + 1) % puzzleList.length;
    loadPuzzle();
  });
  hintEl.addEventListener("click", () => {
    const answer = expectedMove();
    if (answer) showStatus("Hint: " + answer.san, "retry");
  });
  start();
})();