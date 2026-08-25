import { Link, Navigate, useParams } from "react-router-dom";

import {
  getArticleBySlug,
  getRelatedArticles,
  getAdjacentArticles,
} from "../data/articles";

import usePageMeta from "../hooks/usePageMeta";

import "./ArticlePage.css";

/* ============================================================
   REUSABLE CONTENT RENDERERS
   ============================================================ */

function ArticleBulletList({ items, className = "" }) {
  if (!items?.length) {
    return null;
  }

  return (
    <ul className={className}>
      {items.map((item, index) => {
        const isObject =
          typeof item === "object" && item !== null;

        return (
          <li key={`${isObject ? item.title : item}-${index}`}>
            {isObject ? (
              <>
                {item.title && (
                  <strong className="article-list-title">
                    {item.title}
                  </strong>
                )}

                {item.text && (
                  <span className="article-list-text">
                    {item.text}
                  </span>
                )}
              </>
            ) : (
              item
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ArticleSubheadings({ subheadings }) {
  if (!subheadings?.length) {
    return null;
  }

  return (
    <div className="article-subheadings">
      {subheadings.map((subheading, index) => (
        <div
          className="article-subheading"
          key={`${subheading.heading}-${index}`}
        >
          <h3>{subheading.heading}</h3>

          <ArticleBulletList
            items={subheading.bullets}
            className="article-subheading-list"
          />

          {subheading.paragraphs?.map(
            (paragraph, paragraphIndex) => (
              <p
                key={`${subheading.heading}-${paragraphIndex}`}
              >
                {paragraph}
              </p>
            )
          )}
        </div>
      ))}
    </div>
  );
}

function ArticleNumberedSteps({ steps }) {
  if (!steps?.length) {
    return null;
  }

  return (
    <ol className="article-numbered-steps">
      {steps.map((step, index) => (
        <li
          className="article-step"
          key={`${step.title}-${index}`}
        >
          <span
            className="article-step-number"
            aria-hidden="true"
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="article-step-content">
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ArticleExample({ example }) {
  if (!example) {
    return null;
  }

  return (
    <aside
      className="article-example"
      aria-label={example.title || "Practical example"}
    >
      <span className="article-example-label">
        Practical Example
      </span>

      <h3>{example.title || "Example"}</h3>

      <p>{example.text}</p>
    </aside>
  );
}

function ArticleCardCollection({
  items,
  className,
  itemClassName,
}) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div
          className={itemClassName}
          key={`${item.title}-${index}`}
        >
          <span className="article-collection-number">
            {String(index + 1).padStart(2, "0")}
          </span>

          <h3>{item.title}</h3>

          {item.text && <p>{item.text}</p>}
        </div>
      ))}
    </div>
  );
}

function ArticleWarning({ warning }) {
  if (!warning) {
    return null;
  }

  return (
    <aside
      className="article-warning"
      aria-label={warning.heading || "Important warning"}
    >
      <h3>{warning.heading || "Important Considerations"}</h3>

      {warning.text && <p>{warning.text}</p>}

      <ArticleBulletList
        items={warning.bullets}
        className="article-warning-list"
      />
    </aside>
  );
}

function ArticleSection({ section, sectionIndex }) {
  return (
    <section
      id={section.id}
      className="article-section"
      aria-labelledby={`article-section-heading-${sectionIndex}`}
    >
      <h2 id={`article-section-heading-${sectionIndex}`}>
        {section.heading}
      </h2>

      {section.paragraphs?.map(
        (paragraph, paragraphIndex) => (
          <p key={`${sectionIndex}-paragraph-${paragraphIndex}`}>
            {paragraph}
          </p>
        )
      )}

      <ArticleBulletList
        items={section.bullets}
        className="article-bullet-list"
      />

      <ArticleBulletList
        items={section.benefits}
        className="article-benefits-list"
      />

      <ArticleSubheadings
        subheadings={section.subheadings}
      />

      <ArticleNumberedSteps
        steps={section.numberedSteps}
      />

      <ArticleExample example={section.example} />

      <ArticleCardCollection
        items={section.pricingModels}
        className="article-pricing-grid"
        itemClassName="article-pricing-card"
      />

      <ArticleCardCollection
        items={section.checklist}
        className="article-checklist-grid"
        itemClassName="article-checklist-card"
      />

      <ArticleWarning warning={section.warning} />
    </section>
  );
}

/* ============================================================
   MAIN ARTICLE PAGE
   ============================================================ */

function ArticlePage() {
  const { slug } = useParams();

  const article = getArticleBySlug(slug);

  usePageMeta({
    title:
      article?.metaTitle ||
      article?.seoTitle ||
      "Article Not Found",
    description:
      article?.metaDescription ||
      "The requested article could not be found.",
    path: article ? `/blog/${article.slug}` : "/404",
  });

  if (!article) {
    return <Navigate to="/404" replace />;
  }

  const relatedArticles = getRelatedArticles(article, 3);

  const { previousArticle, nextArticle } =
    getAdjacentArticles(article.slug);

  const introduction = Array.isArray(article.introduction)
    ? article.introduction
    : article.introduction
      ? [article.introduction]
      : [];

  const conclusion = Array.isArray(article.conclusion)
    ? article.conclusion
    : article.conclusion
      ? [article.conclusion]
      : [];

  const primaryCtaLabel =
    article.cta?.primaryLabel ||
    article.cta?.buttonText;

  const primaryCtaLink =
    article.cta?.primaryLink ||
    article.cta?.buttonLink;

  const secondaryCtaLabel =
    article.cta?.secondaryLabel;

  const secondaryCtaLink =
    article.cta?.secondaryLink;

  const formattedPublishedDate = new Date(
    `${article.publishedDate}T00:00:00`
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedUpdatedDate = article.updatedDate
    ? new Date(
        `${article.updatedDate}T00:00:00`
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="article-page">
      <div className="article-container">
        <nav
          className="article-breadcrumb"
          aria-label="Breadcrumb"
        >
          <Link to="/">Home</Link>

          <span aria-hidden="true">/</span>

          <Link to="/resources">Resources</Link>

          <span aria-hidden="true">/</span>

          <span aria-current="page">
            {article.title}
          </span>
        </nav>

        <header className="article-header">
          <span className="article-category">
            {article.category}
          </span>

          <h1>{article.title}</h1>

          <p className="article-description">
            {article.shortDescription}
          </p>

          <div className="article-meta">
            <span>{article.author}</span>

            <span aria-hidden="true">•</span>

            <time dateTime={article.publishedDate}>
              Published: {formattedPublishedDate}
            </time>

            {formattedUpdatedDate &&
              article.updatedDate !==
                article.publishedDate && (
                <>
                  <span aria-hidden="true">•</span>

                  <time dateTime={article.updatedDate}>
                    Updated: {formattedUpdatedDate}
                  </time>
                </>
              )}

            <span aria-hidden="true">•</span>

            <span>{article.readingTime}</span>
          </div>

          <img
            src={article.featuredImage}
            alt={article.featuredImageAlt}
            className="article-image"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </header>

        <article className="article-content">
          {introduction.length > 0 && (
            <div className="article-introduction">
              {introduction.map((paragraph, index) => (
                <p
                  className={
                    index === 0 ? "article-intro" : ""
                  }
                  key={`introduction-${index}`}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {article.sections?.map(
            (section, sectionIndex) => (
              <ArticleSection
                key={
                  section.id ||
                  `${section.heading}-${sectionIndex}`
                }
                section={section}
                sectionIndex={sectionIndex}
              />
            )
          )}

          {conclusion.length > 0 && (
            <section
              className="article-conclusion"
              aria-labelledby="article-conclusion-heading"
            >
              <span className="article-conclusion-label">
                Final Thoughts
              </span>

              <h2 id="article-conclusion-heading">
                Conclusion
              </h2>

              {conclusion.map((paragraph, index) => (
                <p key={`conclusion-${index}`}>
                  {paragraph}
                </p>
              ))}
            </section>
          )}

          {article.faqs?.length > 0 && (
            <section
              className="faq-section"
              aria-labelledby="article-faq-heading"
            >
              <h2 id="article-faq-heading">
                Frequently Asked Questions
              </h2>

              <div className="faq-list">
                {article.faqs.map((faq, index) => (
                  <div
                    key={`${faq.question}-${index}`}
                    className="faq-item"
                  >
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {article.cta && (
            <section
              className="article-cta"
              aria-labelledby="article-cta-heading"
            >
              <h2 id="article-cta-heading">
                {article.cta.heading}
              </h2>

              <p>{article.cta.text}</p>

              <div className="article-cta-actions">
                {primaryCtaLabel && primaryCtaLink && (
                  <Link
                    to={primaryCtaLink}
                    className="article-cta-button article-cta-primary"
                  >
                    {primaryCtaLabel}
                  </Link>
                )}

                {secondaryCtaLabel &&
                  secondaryCtaLink && (
                    <Link
                      to={secondaryCtaLink}
                      className="article-cta-button article-cta-secondary"
                    >
                      {secondaryCtaLabel}
                    </Link>
                  )}
              </div>
            </section>
          )}
        </article>

        {relatedArticles.length > 0 && (
          <section
            className="related-articles"
            aria-labelledby="related-articles-heading"
          >
            <h2 id="related-articles-heading">
              Related Articles
            </h2>

            <div className="related-grid">
              {relatedArticles.map((item) => (
                <Link
                  key={item.slug}
                  to={`/blog/${item.slug}`}
                  className="related-card"
                >
                  <img
                    src={item.featuredImage}
                    alt={item.featuredImageAlt}
                    loading="lazy"
                    decoding="async"
                  />

                  <div className="related-card-content">
                    <span className="related-category">
                      {item.category}
                    </span>

                    <h3>{item.title}</h3>

                    <p>{item.shortDescription}</p>

                    <span className="related-read-more">
                      Read Article →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {(previousArticle || nextArticle) && (
          <nav
            className="article-navigation"
            aria-label="Article navigation"
          >
            <div className="article-navigation-previous">
              {previousArticle && (
                <Link
                  to={`/blog/${previousArticle.slug}`}
                >
                  <span>Previous Article</span>

                  <strong>
                    ← {previousArticle.title}
                  </strong>
                </Link>
              )}
            </div>

            <div className="article-navigation-next">
              {nextArticle && (
                <Link
                  to={`/blog/${nextArticle.slug}`}
                >
                  <span>Next Article</span>

                  <strong>
                    {nextArticle.title} →
                  </strong>
                </Link>
              )}
            </div>
          </nav>
        )}

        <div className="article-back-link">
          <Link to="/resources">
            ← Back to Resources
          </Link>
        </div>
      </div>
    </main>
  );
}

export default ArticlePage;