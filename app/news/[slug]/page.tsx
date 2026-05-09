// app/news/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getNewsPosts, getNewsPost, getPostImage, getPostImageAlt, stripHtml } from '@/lib/news';
import NewsArticle from '@/components/NewsArticle';

export const revalidate = 60;

/* ── generateStaticParams ────────────────────────────────────────────
   Предгенерируем последние 20 новостей при билде.
   Остальные отдаются динамически (revalidate = 60).
──────────────────────────────────────────────────────────────────── */
export async function generateStaticParams() {
  const posts = await getNewsPosts(20);
  return posts.map((p) => ({ slug: p.slug }));
}

/* ── generateMetadata ────────────────────────────────────────────────
   SEO: использует ACF-поля seo_title / seo_description если заполнены,
   иначе берёт из заголовка и excerpta поста.
──────────────────────────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsPost(slug);
  if (!post) return {};

  const title       = post.acf?.seo_title       || post.title.rendered;
  const description = post.acf?.seo_description  || stripHtml(post.excerpt.rendered).slice(0, 160);
  const image       = getPostImage(post, 'large');
  const alt         = getPostImageAlt(post);
  const canonical   = `/news/${slug}`;

  return {
    title:       `${title} | PrimeSport`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type:        'article',
      publishedTime: post.date,
      modifiedTime:  post.modified,
      url:         canonical,
      siteName:    'PrimeSport',
      ...(image && {
        images: [{ url: image, alt, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

/* ── Page ────────────────────────────────────────────────────────── */
export default async function NewsSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getNewsPost(slug);
  if (!post) notFound();

  return (
    <>
      {/* JSON-LD structured data — Article schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type':    'NewsArticle',
            headline:   stripHtml(post.title.rendered),
            description: post.acf?.seo_description || stripHtml(post.excerpt.rendered).slice(0, 160),
            image:      getPostImage(post, 'large') || undefined,
            datePublished:  post.date,
            dateModified:   post.modified,
            author: {
              '@type': 'Organization',
              name:    'PrimeSport',
            },
            publisher: {
              '@type': 'Organization',
              name:    'PrimeSport',
              logo: {
                '@type': 'ImageObject',
                url:     `${process.env.NEXT_PUBLIC_SITE_URL}/Logo.png`,
              },
            },
            mainEntityOfPage: {
              '@type': '@id',
              '@id':   `${process.env.NEXT_PUBLIC_SITE_URL}/news/${post.slug}`,
            },
          }),
        }}
      />
      <NewsArticle post={post} />
    </>
  );
}