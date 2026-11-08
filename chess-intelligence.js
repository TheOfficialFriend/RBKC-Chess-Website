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
  }

  buttons.forEach(button => {
    button.addEventListener("click", () => selectChapter(button.dataset.chapter));
  });

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