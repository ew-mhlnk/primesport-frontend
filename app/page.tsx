import Header from '@/components/Header';
import HeroLive from '@/components/HeroLive';
import BroadcastCarousel from '@/components/BroadcastCarousel';
import { WPPost } from '@/types';

export const revalidate = 0;

async function getPosts(): Promise<WPPost[]> {
  try {
    // Внимание: ?_embed здесь крайне важен для получения картинок
    const res = await fetch(`${process.env.NEXT_PUBLIC_WP_API}/posts?_embed`);
    if (!res.ok) return[];
    return res.json();
  } catch (error) {
    console.error("Ошибка API:", error);
    return[];
  }
}

export default async function Home() {
  const posts = await getPosts();

  // Ищем матч, у которого статус live (или старая галочка is_live)
  const mainLivePost = posts.find(p => p.acf?.match_status === 'live' || p.acf?.is_live) || (posts.length > 0 ? posts[0] : null);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />
      
      <div className="pt-0">
        <HeroLive post={mainLivePost} /> 
      </div>

      <BroadcastCarousel posts={posts} />

      <section id="schedule" className="py-12 px-4 md:px-16 max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-8">Расписание</h2>
        <div className="bg-zinc-900 rounded-[40px] p-8 border border-white/5">
           <p className="text-zinc-500">Сетка турниров скоро появится...</p>
        </div>
      </section>
    </main>
  );
}