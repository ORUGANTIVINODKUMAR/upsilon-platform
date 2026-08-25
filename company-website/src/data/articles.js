// Existing articles
import article01 from "./articles/article01";
import article02 from "./articles/article02";

// Batch 1
import article03 from "./articles/article03";
import article04 from "./articles/article04";
import article05 from "./articles/article05";
import article06 from "./articles/article06";
import article07 from "./articles/article07";
import article08 from "./articles/article08";
import article09 from "./articles/article09";
import article10 from "./articles/article10";

export const articles = [
  article01,
  article02,
  article03,
  article04,
  article05,
  article06,
  article07,
  article08,
  article09,
  article10,
];

export const getAllArticles = () =>
  [...articles].sort(
    (a, b) =>
      new Date(b.publishedDate) -
      new Date(a.publishedDate)
  );

export const getArticleBySlug = (slug) =>
  articles.find((article) => article.slug === slug);

export const getArticlesByCategory = (category) =>
  articles.filter(
    (article) => article.category === category
  );

export const getArticleCategories = () => [
  "All",
  ...new Set(articles.map((article) => article.category)),
];

export const getFeaturedArticles = () =>
  articles.filter((article) => article.featured);

export const getLatestArticles = (count = 6) =>
  getAllArticles().slice(0, count);

export const getRelatedArticles = (
  article,
  limit = 3
) =>
  articles
    .filter(
      (item) =>
        item.slug !== article.slug &&
        (item.category === article.category ||
          article.relatedSlugs?.includes(item.slug))
    )
    .slice(0, limit);

export const getAdjacentArticles = (slug) => {
  const sorted = getAllArticles();
  const index = sorted.findIndex(
    (article) => article.slug === slug
  );

  return {
    previousArticle:
      index > 0 ? sorted[index - 1] : null,
    nextArticle:
      index < sorted.length - 1
        ? sorted[index + 1]
        : null,
  };
};
