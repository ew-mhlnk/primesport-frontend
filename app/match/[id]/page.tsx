// app/match/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MatchLayout from '@/components/MatchLayout';
import { WPPost } from '@/types';

// Живые страницы не кешируем, но и не делаем revalidate=0 —
// revalidate=60 даёт CDN кешировать на минуту, снижая нагрузку
export const revalidate = 60;

const WP_API = process.env.NEXT_PUBLIC_WP_API!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://primesport.tv';

async function getPost(id: string): Promise<WPPost | null> {
  try {
    const res = await fetch(`${WP_API}/posts/${id}?_embed`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/* ── generateMetadata ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return {};

  const title    = post.acf?.match_subtitle || post.title.rendered;
  const tournament = post.acf?.match_tournament ?? '';
  const isLive   = post.acf?.match_status === 'live' || post.acf?.is_live;
  const thumb    = post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? '';

  // Для LIVE страниц добавляем префикс — он привлекает внимание в выдаче
  const metaTitle = isLive
    ? `🔴 LIVE: ${title} | PrimeSport`
    : `${title}${tournament ? ` — ${tournament}` : ''} | PrimeSport`;

  const description = isLive
    ? `Смотрите прямой эфир: ${title}. Бесплатная онлайн трансляция на PrimeSport.`
    : `Смотрите трансляцию ${title}${tournament ? ` — ${tournament}` : ''}. Теннис онлайн на PrimeSport.`;

  return {
    title: metaTitle,
    description,
    alternates: {
      canonical: `/match/${id}`,
    },
    openGraph: {
      title: metaTitle,
      description,
      type:        'video.other',
      url:         `${SITE_URL}/match/${id}`,
      siteName:    'PrimeSport',
      locale:      'ru_RU',
      ...(thumb && {
        images: [{ url: thumb, width: 1280, height: 720, alt: title }],
      }),
    },
    twitter: {
      card:        'summary_large_image',
      title:       metaTitle,
      description,
      ...(thumb && { images: [thumb] }),
    },
    // Не индексировать страницы без контента
    robots: post.acf?.match_embed
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

/* ── Page ── */
export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const title      = post.acf?.match_subtitle || post.title.rendered;
  const tournament = post.acf?.match_tournament ?? '';
  const isLive     = post.acf?.match_status === 'live' || post.acf?.is_live;
  const thumb      = post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? '';
  const embedUrl   = `${SITE_URL}/match/${id}`;
  const pageUrl    = `${SITE_URL}/match/${id}`;

  // ── JSON-LD: VideoObject + BroadcastEvent ──────────────────────────────
  // BroadcastEvent даёт бейджик LIVE прямо в поиске Google.
  // Важно: после окончания трансляции обновите isLiveBroadcast → false
  // и вызовите Google Indexing API (см. комментарий ниже).
  const videoSchema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description: `Трансляция ${title}${tournament ? ` — ${tournament}` : ''}. Смотреть онлайн на PrimeSport.`,
    thumbnailUrl: thumb || `${SITE_URL}/og-default.jpg`,
    uploadDate: post.date,
    embedUrl,
    ...(isLive && {
      publication: {
        '@type': 'BroadcastEvent',
        isLiveBroadcast: true,
        startDate: post.date,
        // endDate — проставь когда трансляция закончится
      },
    }),
    publisher: {
      '@type': 'Organization',
      name: 'PrimeSport',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/Logo.png`,
      },
    },
  };

  // ── JSON-LD: SportsEvent ───────────────────────────────────────────────
  // Даёт Google понять что это спортивное событие, повышает
  // шансы попасть в "События" и Google Discover
  const sportsEventSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: title,
    sport: 'Tennis',
    startDate: post.date,
    eventStatus: isLive
      ? 'https://schema.org/EventScheduled'
      : 'https://schema.org/EventPostponed',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: pageUrl,
    },
    organizer: {
      '@type': 'Organization',
      name: 'PrimeSport',
      url: SITE_URL,
    },
    image: thumb || `${SITE_URL}/og-default.jpg`,
    description: `Смотреть теннис онлайн: ${title}${tournament ? `. Турнир: ${tournament}` : ''}.`,
    ...(tournament && {
      superEvent: {
        '@type': 'SportsEvent',
        name: tournament,
      },
    }),
  };

  // ── JSON-LD: BreadcrumbList ────────────────────────────────────────────
  // Навигационные крошки в сниппете Google
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная',  item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Теннис',   item: `${SITE_URL}/tennis` },
      { '@type': 'ListItem', position: 3, name: title,      item: pageUrl },
    ],
  };

  // ── Google Indexing API ────────────────────────────────────────────────
  // TODO: вызывать этот API при публикации LIVE-поста через Make.com/вебхук:
  //   POST https://indexing.googleapis.com/v3/urlNotifications:publish
  //   { "url": "https://primesport.tv/match/<id>", "type": "URL_UPDATED" }
  // Это заставит Google перекрасить страницу в течение минут, а не часов.
  // Документация: https://developers.google.com/search/apis/indexing-api/v3/quickstart

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEventSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <MatchLayout post={post} />
    </>
  );
}