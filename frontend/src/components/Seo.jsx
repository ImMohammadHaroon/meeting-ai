import { useEffect } from 'react';
import {
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
} from '../config/seo';

function upsertMeta(attribute, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  if (!data) return;

  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noindex = false,
  keywords = DEFAULT_KEYWORDS,
  jsonLd,
}) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — AI Meeting Notes, Transcription & Live Rooms`;
  const canonical = absoluteUrl(path);
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';

  useEffect(() => {
    document.title = pageTitle;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'keywords', keywords);
    upsertMeta('name', 'robots', robots);
    upsertMeta('name', 'author', SITE_NAME);
    upsertMeta('name', 'theme-color', '#000000');

    upsertLink('canonical', canonical);

    upsertMeta('property', 'og:title', pageTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:image:alt', `${SITE_NAME} — AI-powered meeting platform`);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:locale', 'en_US');

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', pageTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);

    upsertJsonLd('seo-json-ld', jsonLd);

    return () => {
      document.getElementById('seo-json-ld')?.remove();
    };
  }, [pageTitle, description, keywords, robots, canonical, image, type, jsonLd]);

  return null;
}
