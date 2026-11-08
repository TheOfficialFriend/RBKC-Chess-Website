(() => {
  const studyId = "3i3ARGDs";
  const title = document.getElementById("study-chapter-title");
  const frame = document.getElementById("study-frame");
  const openLink = document.getElementById("study-open-link");
  const buttons = Array.from(document.querySelectorAll(".ci-study-chapter"));
  const searchInput = document.getElementById("study-player-search");
  const searchResults = document.getElementById("study-search-results");
  const games = [
    { chapterId: "cz0GUuAz", chapterName: "Chapter 1 · Tactical awareness", white: "Ahmed Dabo", black: "Leonel Mbaho" },
    { chapterId: "U5NhdKPO", chapterName: "Chapter 2 · Space vs development", white: "Ahmed Dabo", black: "" },
    { chapterId: "Oj0Y15F1", chapterName: "Chapter 3 · Positional pressure", white: "Ahmed Dabo", black: "Leonel Mbaho" }
  ];
  const notationRows = document.getElementById("study-notation-rows");
  const notation = {
    cz0GUuAz: [["g3","c5"],["Bg2","Nc6"],["c4","g6"],["Nc3","Bg7"],["Bxc6","dxc6"],["Ne4","Nf6"],["Nxc5","O-O"],["Nf3","Bh3"],["Ng5","Bg2"],["Rg1","h6"],["Rxg2","hxg5"],["d4","b6"],["Nd3","Qxd4"],["Bxg5","Rad8"],["Be3","Qxc4"],["b3","Ne4"],["bxc4","Bxa1"],["Qxa1","c5"],["Bh6",""]],
    U5NhdKPO: [["g3","d5"],["d4","Bg4"],["f3","Bh5"],["g4","Bg6"],["h4","h6"],["h5","Bh7"],["Bf4","c5"],["Nd2","Nc6"],["c3","Nf6"],["Qa4","Qb6"],["b3","cxd4"],["cxd4","Qxd4"],["Qxd4","Nxd4"],["Be3","e5"],["Rc1","Nc2+"],["Kf2","Rc8"],["Bxa7","d4"],["Bg2","Ba3"],["Rd1","Ne3"],["Re1","Nxg2"],["Kxg2","Rc1"],["Rxc1","Bxc1"],["Nc4","Ne7"],["Nh3","Be3"],["Nd6+","Kd7"],["Nxb7","Ra8"],["Nc5+","Kc7"],["Ne6+","Kb7"],["Bc5","Rxa2"],["Bxe7","Rxe2+"],["Kf1","Bd3"],["Nc5+","Kc6"],["Nxd3","Ra2"],["Nb4+",""]],
    Oj0Y15F1: [["c4","f5"],["g3","Nf6"],["Bg2","e6"],["Nc3","Bd6"],["Nb5","Bc5"],["d4","Bb6"],["Bd2","a6"],["c5","Ba7"],["Nc3","O-O"],["Bg5","d6"],["d5","Bxc5"],["dxe6","Bxe6"],["Bxb7","Ra7"],["Bg2","c6"],["a3","Qa5"],["Nh3","Qb6"],["b4","Bd4"],["Na4","Qb5"],["Qxd4","Qxa4"],["O-O","Rd7"],["Nf4","c5"],["Qe3","Bb3"],["Rab1","c4"],["Bxf6","Rxf6"],["Qe8+","Rf8"]]
  };

  function renderNotation(chapterId) {
    if (!notationRows) return;
    notationRows.replaceChildren();
    (notation[chapterId] || []).forEach((pair, index) => {
      const row = document.createElement("tr");
      const number = document.createElement("th");
      number.scope = "row";
      number.textContent = String(index + 1);
      const white = document.createElement("td");
      white.textContent = pair[0];
      const black = document.createElement("td");
      black.textContent = pair[1];
      row.append(number, white, black);
      notationRows.append(row);
    });
  }

  function selectChapter(chapterId) {
    const button = buttons.find(item => item.dataset.chapter === chapterId);
    if (!button) return;
    const chapterName = button.textContent.trim();
    buttons.forEach(item => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    title.textContent = chapterName;
    frame.title = chapterName;
    frame.src = "https://lichess.org/study/embed/" + studyId + "/" + encodeURIComponent(chapterId);
    openLink.href = "https://lichess.org/study/" + studyId + "/" + encodeURIComponent(chapterId);
    renderNotation(chapterId);
  }

  buttons.forEach(button => {
    button.addEventListener("click", () => selectChapter(button.dataset.chapter));
  });
  renderNotation(buttons[0]?.dataset.chapter || "cz0GUuAz");

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLocaleLowerCase();
    searchResults.replaceChildren();
    searchResults.hidden = !query;
    if (!query) return;

    const matches = games.filter(game =>
      [game.white, game.black].some(name => name.toLocaleLowerCase().includes(query))
    );
    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "ci-search-empty";
      empty.textContent = "No games found for that player name.";
      searchResults.append(empty);
      return;
    }

    const list = document.createElement("ul");
    list.className = "ci-search-list";
    matches.forEach(game => {
      const item = document.createElement("li");
      const result = document.createElement("button");
      result.type = "button";
      result.className = "ci-search-result";
      result.textContent = game.black
        ? game.white + " vs " + game.black + " · " + game.chapterName
        : game.white + " · " + game.chapterName;
      result.addEventListener("click", () => selectChapter(game.chapterId));
      item.append(result);
      list.append(item);
    });
    searchResults.append(list);
  });
})();