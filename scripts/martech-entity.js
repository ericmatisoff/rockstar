/*
 * Reads the article metadata from the page <head> and shapes it as
 * Adobe Target Recommendations entity attributes.
 *
 * Returns null on pages that are not articles (no category and no tags),
 * so the home page, nav, and footer never land in the catalog.
 */

function getMeta(name) {
  const el = document.querySelector(`meta[name="${name}"]`);
  return el ? el.content.trim() : '';
}

function getProperty(prop) {
  const el = document.querySelector(`meta[property="${prop}"]`);
  return el ? el.content.trim() : '';
}

function getArticleTags() {
  return [...document.querySelectorAll('meta[property="article:tag"]')]
    .map((el) => el.content.trim())
    .filter(Boolean);
}

export function getEntityData() {
  const category = getMeta('category');
  const tags = getArticleTags();

  // Not an article, so do not add it to the catalog.
  if (!category && tags.length === 0) return null;

  const canonical = document.querySelector('link[rel="canonical"]');
  const pageUrl = canonical ? canonical.href : window.location.href;
  const id = new URL(pageUrl).pathname.replace(/^\/|\/$/g, '');

  return {
    // Reserved Target entity attributes
    'entity.id': id,
    'entity.name': document.title,
    'entity.categoryId': category,
    'entity.pageUrl': pageUrl,
    'entity.thumbnailUrl': getProperty('og:image'),
    'entity.message': getMeta('description'),
    // Custom attributes, names match the on-page meta tags and the CSV columns
    'entity.products': getMeta('products'),
    'entity.content_type': getMeta('content_type'),
    'entity.level': getMeta('level'),
    'entity.published_date': getMeta('published_date'),
    'entity.tags': tags.join(','),
  };
}
