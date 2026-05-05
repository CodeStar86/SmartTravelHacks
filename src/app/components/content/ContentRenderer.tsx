import type { ElementType } from 'react';
import { ContentBlock } from '../../types';
import { ImageWithFallback } from '../shared/ImageWithFallback';
import DOMPurify from 'dompurify';
import { handleAffiliateClickEvent, isAffiliateHref } from '../../lib/affiliate';

import { logger } from '../../lib/logger';
interface ContentRendererProps {
  blocks: ContentBlock[] | string;
  showAds?: boolean;
  adsenseEnabled?: boolean;
}

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

function sanitizeInlineHTML(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'a', 'strong', 'em', 'u', 'br', 'code', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

function hasRenderableHTML(value?: string) {
  return !!value && HTML_TAG_PATTERN.test(value);
}

function markdownLinksToHtml(value: string) {
  return value.replace(
    MARKDOWN_LINK_PATTERN,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

function normalizeRichText(value?: string) {
  if (!value) return '';

  let normalized = value
    .replace(/&lt;a\b/gi, '<a')
    .replace(/&lt;\/a&gt;/gi, '</a>')
    .replace(/&lt;p&gt;/gi, '<p>')
    .replace(/&lt;\/p&gt;/gi, '</p>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br />')
    .replace(/&gt;/g, '>');

  if (MARKDOWN_LINK_PATTERN.test(value)) {
    normalized = markdownLinksToHtml(normalized);
  }

  if (normalized.includes('<a ') || normalized.includes('<p>') || normalized.includes('<br')) {
    if (!normalized.trim().startsWith('<')) {
      normalized = `<p>${normalized}</p>`;
    }

    normalized = normalized
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br />');

    return sanitizeInlineHTML(normalized);
  }

  return '';
}

function isLikelyValidImageUrl(url?: string) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  );
}

export function ContentRenderer({ blocks, showAds = false, adsenseEnabled = false }: ContentRendererProps) {
  if (typeof blocks === 'string') {
    const richHtml = normalizeRichText(blocks);

    return (
      <div className="prose prose-lg max-w-none
        prose-headings:font-bold prose-headings:text-gray-900
        prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8
        prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200
        prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6
        prose-h4:text-xl prose-h4:mb-2 prose-h4:mt-4
        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-lg
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900 prose-strong:font-semibold
        prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
        prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
        prose-li:mb-2 prose-li:text-gray-700
        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
        prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-gray-800
        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
        prose-img:rounded-lg prose-img:shadow-md">
        {richHtml ? (
          <div
            onClickCapture={(e) => {
              const target = e.target as HTMLElement | null;
              const link = target?.closest?.('a') as HTMLAnchorElement | null;
              if (link?.href && isAffiliateHref(link.getAttribute('href') || link.href)) {
                handleAffiliateClickEvent(e as any, link.getAttribute('href') || link.href, link.getAttribute('target'));
              }
            }}
            dangerouslySetInnerHTML={{ __html: richHtml }}
          />
        ) : (
          <div className="whitespace-pre-wrap">{blocks}</div>
        )}
      </div>
    );
  }

  if (!Array.isArray(blocks)) {
    logger.warn('[ContentRenderer] Invalid blocks type:', typeof blocks);
    return (
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-500">No content available</p>
      </div>
    );
  }

  let headingCount = 0;

  return (
    <div
      className="prose prose-lg max-w-none
      prose-headings:font-bold prose-headings:text-gray-900
      prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8
      prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200
      prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6
      prose-h4:text-xl prose-h4:mb-2 prose-h4:mt-4
      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-lg
      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
      prose-strong:text-gray-900 prose-strong:font-semibold
      prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
      prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
      prose-li:mb-2 prose-li:text-gray-700
      prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
      prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-gray-800
      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
      prose-img:rounded-lg prose-img:shadow-md"
      onClickCapture={(e) => {
        const target = e.target as HTMLElement | null;
        const link = target?.closest?.('a') as HTMLAnchorElement | null;
        if (link?.href && isAffiliateHref(link.getAttribute('href') || link.href)) {
          handleAffiliateClickEvent(e as any, link.getAttribute('href') || link.href, link.getAttribute('target'));
        }
      }}
    >
      {blocks.map((block, index) => {
        const shouldShowAd = showAds && adsenseEnabled && (
          index === 0 ||
          index === Math.floor(blocks.length / 2) ||
          index === blocks.length - 1
        );

        const currentHeadingIndex = block.type === 'heading' ? headingCount++ : -1;

        return (
          <div key={block.id || `block-${index}`}>
            {renderBlock(block, currentHeadingIndex)}
            {shouldShowAd && (
              <div className="my-8 p-4 bg-gray-50 text-center">
                <p className="text-xs text-gray-500 mb-2">Advertisement</p>
                <div className="h-32 flex items-center justify-center bg-gray-200 rounded">
                  AdSense Ad Slot
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderBlock(block: ContentBlock, headingIndex: number) {
  switch (block.type) {
    case 'heading':
      return renderHeading(block, headingIndex);
    case 'paragraph':
      return renderParagraph(block);
    case 'image':
      return renderImage(block);
    case 'list':
      return renderList(block);
    case 'table':
      return renderTable(block);
    case 'callout':
      return renderCallout(block);
    case 'button':
      return renderButton(block);
    case 'html':
      return renderHTML(block);
    default:
      return null;
  }
}

function renderHeading(block: ContentBlock, headingIndex: number) {
  const { text, level = 2 } = block.content || {};
  const safeLevel = Math.min(6, Math.max(1, Number(level) || 2));
  const HeadingTag = `h${safeLevel}` as ElementType;
  const id = `heading-${headingIndex}`;

  return (
    <HeadingTag id={id} className="scroll-mt-20">
      {text}
    </HeadingTag>
  );
}

function renderParagraph(block: ContentBlock) {
  const { html, text } = block.content || {};

  if (html) {
    const sanitized = sanitizeInlineHTML(html);
    return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
  }

  const richHtml = normalizeRichText(text);
  if (richHtml || hasRenderableHTML(text)) {
    return <div dangerouslySetInnerHTML={{ __html: richHtml || sanitizeInlineHTML(text) }} />;
  }

  return <p>{text}</p>;
}

function renderImage(block: ContentBlock) {
  const { url, alt, caption, width, height } = block.content || {};

  if (!isLikelyValidImageUrl(url)) {
    return caption ? (
      <div className="my-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center not-prose">
        <p className="text-sm text-gray-500">Image unavailable</p>
        <p className="mt-2 text-sm text-gray-600">{caption}</p>
      </div>
    ) : null;
  }

  return (
    <figure className="my-8 not-prose">
      <ImageWithFallback
        src={url}
        alt={alt || ''}
        className="rounded-lg w-full max-w-3xl max-h-96 mx-auto shadow-md object-cover"
        width={width}
        height={height}
      />
      {caption && (
        <figcaption className="text-sm text-gray-600 mt-2 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function renderList(block: ContentBlock) {
  const { items, ordered } = block.content || {};

  if (!items || !Array.isArray(items)) {
    return null;
  }

  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <ListTag className={`my-6 space-y-3 ${ordered ? 'list-decimal list-inside' : 'list-none'}`}>
      {items.map((item: string, index: number) => (
        <li
          key={index}
          className={`text-gray-700 leading-relaxed ${
            ordered
              ? 'pl-2'
              : 'pl-8 relative before:content-[""] before:absolute before:left-0 before:top-[0.6em] before:w-2 before:h-2 before:bg-blue-500 before:rounded-full'
          }`}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }}
        />
      ))}
    </ListTag>
  );
}

function renderTable(block: ContentBlock) {
  const { headers = [], rows = [] } = block.content || {};

  return (
    <div className="overflow-x-auto my-8">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header: string, i: number) => (
              <th key={i} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: string[], i: number) => (
            <tr key={i} className="hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="border border-gray-300 px-4 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCallout(block: ContentBlock) {
  const { text, type = 'info' } = block.content || {};

  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
  };

  return (
    <div className={`border-l-4 p-4 my-6 ${styles[type as keyof typeof styles] || styles.info}`}>
      {text}
    </div>
  );
}

function renderButton(block: ContentBlock) {
  const { text, url, style = 'primary' } = block.content || {};

  const styles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  };

  const isAffiliate = isAffiliateHref(url);

  return (
    <div className="my-6">
      <a
        href={url}
        className={`inline-block px-6 py-3 rounded-lg font-semibold transition ${styles[style as keyof typeof styles] || styles.primary}`}
        target={isAffiliate ? undefined : "_blank"}
        rel="noopener noreferrer"
        onClick={(e) => {
          if (isAffiliate) {
            handleAffiliateClickEvent(e, url);
          }
        }}
      >
        {text}
      </a>
    </div>
  );
}

function renderHTML(block: ContentBlock) {
  const { html } = block.content || {};
  const sanitized = DOMPurify.sanitize(html || '');

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
