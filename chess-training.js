import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";

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

  let engineWorker = null;
  let engineReadyPromise = null;
  let enginePending = null;
  let engineBusy = false;
  const engineBase = "https://cdn.jsdelivr.net/npm/stockfish@19.0.1/bin/";
  const engineScript = engineBase + "stockfish-19-lite-single.js";
  const engineDepth = 10;

  function ensureEngine() {
    if (engineReadyPromise) return engineReadyPromise;
    engineReadyPromise = new Promise((resolve, reject) => {
      const workerCode = 'self.Module={locateFile:function(path){return "' + engineBase + '" + path.split("/").pop();}};importScripts("' + engineScript + '");';
      const workerUrl = URL.createObjectURL(new Blob([workerCode], { type: "text/javascript" }));
      engineWorker = new Worker(workerUrl);
      let startupTimer = setTimeout(() => reject(new Error("Stockfish took too long to start.")), 20000);
      engineWorker.onmessage = event => {
        const line = String(event.data || "").trim();
        if (line === "uciok") { engineWorker.postMessage("isready"); return; }
        if (line === "readyok") { clearTimeout(startupTimer); resolve(); return; }
        if (line.startsWith("bestmove ")) {
          const move = line.split(/\\s+/)[1];
          const pending = enginePending;
          enginePending = null;
          if (pending) { clearTimeout(pending.timer); pending.resolve(move); }
        }
      };
      engineWorker.onerror = event => {
        clearTimeout(startupTimer);
        const error = new Error("Stockfish engine file failed to load" + (event?.message ? ": " + event.message : "."));
        if (enginePending) { clearTimeout(enginePending.timer); enginePending.reject(error); enginePending = null; }
        reject(error);
      };
      engineWorker.postMessage("uci");
    }).catch(error => {
      if (engineWorker) engineWorker.terminate();
      engineWorker = null;
      engineReadyPromise = null;
      throw error;
    });
    return engineReadyPromise;
  }

  async function analyseFen(fen) {
    await ensureEngine();
    return new Promise((resolve, reject) => {
      if (enginePending) { reject(new Error("The engine is still finishing its last move.")); return; }
      enginePending = {
        resolve,
        reject,
        timer: setTimeout(() => {
          if (!enginePending) return;
          enginePending = null;
          reject(new Error("Stockfish analysis timed out. Try again."));
        }, 25000)
      };
      engineWorker.postMessage("setoption name Threads value 1");
      engineWorker.postMessage("position fen " + fen);
      engineWorker.postMessage("go depth " + engineDepth);
    });
  }

  function moveFromUci(uci) {
    if (!uci || uci === "(none)" || uci === "0000") return null;
    return chess.moves({ verbose: true }).find(move =>
      move.from === uci.slice(0, 2) &&
      move.to === uci.slice(2, 4) &&
      (move.promotion || "") === (uci[4] || "")
    ) || null;
  }

  async function bestMoveForPosition() {
    return moveFromUci(await analyseFen(chess.fen()));
  }

  function moveObject(move) {
    return move.promotion
      ? { from: move.from, to: move.to, promotion: move.promotion }
      : { from: move.from, to: move.to };
  }

  function renderBoard() {
    boardEl.replaceChildren();
    const board = chess.board();
    const ranks = userColor === "w" ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
    const files = userColor === "w" ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
    ranks.forEach(rank => files.forEach(file => {
      const sq = String.fromCharCode(97 + file) + String(rank + 1);
      const piece = board[7 - rank][file];
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

  function recordedMove() {
    if (mode === "opening") {
      const san = activeGame.moves[ply];
      return san ? { san } : null;
    }
    const puzzle = puzzleList[puzzleIndex];
    return puzzle ? { san: puzzle.san, move: puzzle.move } : null;
  }

  async function onSquare(square) {
    if (puzzleSolved || engineBusy || (mode === "opening" && chess.turn() !== userColor)) return;
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

    const sourceMove = recordedMove();
    const beforeFen = chess.fen();
    selected = null; targets = [];
    engineBusy = true;
    renderBoard();
    showStatus("Stockfish is analysing this position…", "info");
    try {
      const best = await bestMoveForPosition();
      if (!best) throw new Error("Stockfish did not return a legal move.");
      const isTopMove = candidate.from === best.from && candidate.to === best.to && (candidate.promotion || "") === (best.promotion || "");
      if (!isTopMove) {
        mistakes++;
        const sourceNote = sourceMove && stripSan(sourceMove.san) !== stripSan(best.san)
          ? " The RBKC game played " + sourceMove.san + "."
          : "";
        showStatus("Stockfish’s top move at depth " + engineDepth + " is " + best.san + "." + sourceNote + " Try again.", "retry");
        return;
      }

      chess.load(beforeFen);
      chess.move(moveObject(candidate));
      if (mode === "opening") {
        ply++;
        let replyNote = "";
        if (ply < 24 && chess.turn() !== userColor) {
          showStatus("Top move. Stockfish is preparing the reply…", "info");
          const reply = await bestMoveForPosition();
          if (reply) {
            chess.move(moveObject(reply));
            ply++;
            replyNote = " Stockfish replied " + reply.san + ".";
          }
        }
        const completed = ply >= 24;
        progressEl.textContent = completed ? "12-move opening practice complete" : "Move " + (Math.floor(ply / 2) + 1) + " · " + (userColor === "w" ? "White" : "Black") + " to play";
        const sourceNote = sourceMove && stripSan(sourceMove.san) === stripSan(candidate.san)
          ? " This also matches the RBKC game."
          : sourceMove ? " The RBKC game played " + sourceMove.san + "." : "";
        showStatus(completed ? "Stockfish’s top move. Opening practice complete." + sourceNote : "Stockfish’s top move." + sourceNote + replyNote, "success");
        if (completed) puzzleSolved = true;
      } else {
        puzzleSolved = true;
        progressEl.textContent = "Middlegame position " + (puzzleIndex + 1) + " of " + puzzleList.length;
        const sourceNote = sourceMove && stripSan(sourceMove.san) === stripSan(candidate.san)
          ? " It matches the move in the RBKC game."
          : sourceMove ? " The RBKC game played " + sourceMove.san + "." : "";
        showStatus("Stockfish’s top move at depth " + engineDepth + "." + sourceNote, "success");
        nextEl.hidden = false;
      }
    } catch (error) {
      showStatus(error.message || "Stockfish could not analyse this position. Please try again.", "retry");
    } finally {
      engineBusy = false;
      renderBoard();
    }
  }

  async function startOpening() {
    chess = new Chess();
    selected = null; targets = []; mistakes = 0; puzzleSolved = false; nextEl.hidden = true;
    ply = 0;
    progressEl.textContent = "Move 1 · " + (userColor === "w" ? "White" : "Black") + " to play";
    renderBoard();
    showStatus(userColor === "w" ? "Play a move. Stockfish will check it and play the reply." : "Stockfish is preparing White’s first move…", "info");
    if (userColor === "b") {
      engineBusy = true;
      try {
        const firstMove = await bestMoveForPosition();
        if (!firstMove) throw new Error("Stockfish did not return a legal move.");
        chess.move(moveObject(firstMove));
        ply = 1;
        progressEl.textContent = "Move 1 · Black to play";
        showStatus("Stockfish opened with " + firstMove.san + ". Your move.", "info");
      } catch (error) {
        showStatus(error.message || "Stockfish could not load. Try again or choose White.", "retry");
      } finally {
        engineBusy = false;
        renderBoard();
      }
    }
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
    showStatus("Find Stockfish’s top move in this position.", "info");
  }

  function start() {
    activeGame = games[Number(gameEl.value)] || games[0];
    mode = modeEl.value;
    userColor = sideEl.value;
    if (mode === "opening") return startOpening();
    startMiddlegame();
  }

  modeEl.addEventListener("change", start);
  gameEl.addEventListener("change", start);
  sideEl.addEventListener("change", start);
  resetEl.addEventListener("click", start);
  nextEl.addEventListener("click", () => {
    puzzleIndex = (puzzleIndex + 1) % puzzleList.length;
    loadPuzzle();
  });
  hintEl.addEventListener("click", async () => {
    if (engineBusy || puzzleSolved) return;
    engineBusy = true;
    showStatus("Stockfish is analysing this position…", "info");
    try {
      const best = await bestMoveForPosition();
      if (best) showStatus("Stockfish’s top move at depth " + engineDepth + " is " + best.san + ".", "success");
      else showStatus("Stockfish found no legal move.", "retry");
    } catch (error) {
      showStatus(error.message || "Stockfish could not analyse this position.", "retry");
    } finally {
      engineBusy = false;
    }
  });
  start();
})();