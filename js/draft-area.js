(function () {
  const validYears = new Set(["2025", "2026", "2027"]);
  const params = new URLSearchParams(window.location.search);
  const requestedYear = params.get("ano");
  const year = validYears.has(requestedYear) ? requestedYear : "2026";
  const isReviewPage = window.location.pathname.endsWith("/review-do-draft.html")
    || window.location.pathname.endsWith("review-do-draft.html");

  if (isReviewPage && year === "2027") {
    window.location.replace("guia-do-draft.html?ano=2027");
    return;
  }

  window.T3DraftArea = {
    year,
    hasReview: year !== "2027"
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.title = `${isReviewPage ? "Review" : "Guia"} do Draft ${year} | Tabelado de 3`;

    document.querySelectorAll("[data-draft-year]").forEach((link) => {
      const linkYear = link.dataset.draftYear;
      const target = isReviewPage && linkYear !== "2027" ? "review-do-draft.html" : "guia-do-draft.html";
      link.href = `${target}?ano=${linkYear}`;
      link.classList.toggle("active", linkYear === year);
      if (linkYear === year) link.setAttribute("aria-current", "page");
    });

    document.querySelectorAll("[data-draft-section='guide']").forEach((link) => {
      link.href = `guia-do-draft.html?ano=${year}`;
    });

    document.querySelectorAll("[data-draft-section='review']").forEach((link) => {
      link.href = `review-do-draft.html?ano=${year}`;
      link.hidden = year === "2027";
    });

    document.querySelectorAll("[data-draft-year-label]").forEach((label) => {
      label.textContent = `Draft ${year}`;
    });

    document.querySelectorAll("[data-draft-special-year]").forEach((label) => {
      label.textContent = `especial ${year}`;
    });

  });
})();
