import Header from '@/components/Header';
import HeroLive from '@/components/HeroLive';
import BroadcastCarousel from '@/components/BroadcastCarousel';
import ScheduleWidget from '@/components/ScheduleWidget';
import { WPPost } from '@/types';

export const revalidate = 0;

async function getPosts(): Promise<WPPost[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_WP_API}/posts?_embed`);
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Ошибка API:', error);
    return [];
  }
}

export default async function Home() {
  const posts = await getPosts();

  // Hero: prefer a live post, else fall back to first post
  const mainLivePost =
    posts.find(p => p.acf?.match_status === 'live' || p.acf?.is_live) ??
    (posts.length > 0 ? posts[0] : null);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />

      {/* HeroLive: pt-0, header is fixed so it overlays the hero */}
      <HeroLive post={mainLivePost} relatedPosts={posts} />

      <BroadcastCarousel posts={posts} />

      <section id="schedule" className="py-12 px-4 lg:px-18.75 max-w-480 mx-auto">
        <h2 className="text-3xl lg:text-[40px] font-sans font-bold text-white mb-6 tracking-tight drop-shadow-md">
          Расписание матчей
        </h2>
        <ScheduleWidget />
      </section>
    </main>
  );
}