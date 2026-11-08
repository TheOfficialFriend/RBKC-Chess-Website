(() => {
  const studyId = "3i3ARGDs";
  const title = document.getElementById("study-chapter-title");
  const frame = document.getElementById("study-frame");
  const openLink = document.getElementById("study-open-link");
  const buttons = Array.from(document.querySelectorAll(".ci-study-chapter"));

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const chapterId = button.dataset.chapter;
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
    });
  });
})();