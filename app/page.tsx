// app/page.tsx
import type { Metadata } from 'next';
import Header from '@/components/Header';
import HeroLive from '@/components/HeroLive';
import BroadcastCarousel from '@/components/BroadcastCarousel';
import TournamentsWidget from '@/components/TournamentsWidget';
import ScheduleWidget from '@/components/ScheduleWidget';
import NewsSection from '@/components/NewsSection';
import { getNewsPosts, getBroadcastPosts } from '@/lib/news';
import { WPPost } from '@/types';
import PromoBanner from '@/components/PromoBanner';
export const dynamic = 'force-dynamic'; // ← добавь это

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function Home() {
  const [broadcastPosts, newsPosts] = await Promise.all([
    getBroadcastPosts(20),
    getNewsPosts(7),
  ]);

  const posts = broadcastPosts as unknown as WPPost[];

  const mainLivePost =
    posts.find(p => p.acf?.match_status === 'live' || p.acf?.is_live) ??
    (posts.length > 0 ? posts[0] : null);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <HeroLive post={mainLivePost} relatedPosts={posts} />
      <PromoBanner />
      <BroadcastCarousel posts={posts} />

      {/* Виджет турниров из Supabase */}
      <TournamentsWidget />

      <NewsSection posts={newsPosts} />

      <section id="schedule" className="py-12 px-4 lg:px-[75px] max-w-[1920px] mx-auto">
        <h2 className="text-3xl lg:text-[40px] font-bold text-white mb-6 tracking-tight">
          Расписание матчей
        </h2>
        <ScheduleWidget />
      </section>
    </main>
  );
}