import Header from '@/components/Header';
import TelegramWidget from '@/components/TelegramWidget';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { WPPost } from '@/types';

export const revalidate = 0;

async function getPostById(id: string): Promise<WPPost | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_WP_API}/posts/${id}?_embed`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const matchId = resolvedParams.id;
  
  const post = await getPostById(matchId);

  if (!post) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white pt-28 px-16 text-center">
        <Header />
        <h1 className="text-3xl font-sans font-bold">Матч не найден в WordPress</h1>
        <Link href="/" className="text-blue-500 mt-4 inline-block">Вернуться на главную</Link>
      </main>
    );
  }

  const isLive = post.acf?.match_status === 'live' || post.acf?.is_live;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />
      
      <div className="pt-24 lg:pt-32 pb-12">
        
        {/* Кнопка назад (с отступами) */}
        <div className="px-4 lg:px-18.75 max-w-480 mx-auto mb-4 lg:mb-8">
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white font-sans font-bold transition-colors">
            <ChevronLeft className="w-5 h-5 mr-1" /> Назад
          </Link>
        </div>

        {/* ПЛЕЕР: Вплотную к краям на мобилках, с отступами и скруглениями на ПК */}
        <div className="w-full lg:px-18.75 max-w-480 mx-auto mb-6 lg:mb-10">
          <div className="w-full aspect-video bg-black lg:rounded-[40px] relative lg:border border-white/5 flex items-center justify-center overflow-hidden">
            {post.acf?.match_embed ? (
              <div 
                className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
                dangerouslySetInnerHTML={{ __html: post.acf.match_embed }} 
              />
            ) : (
              <span className="text-zinc-500 font-sans">
                Плеер для матча: <br/>
                <span dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
              </span>
            )}
          </div>
        </div>

        {/* Текст и описание матча (с отступами) */}
        <div className="px-4 lg:px-18.75 max-w-480 mx-auto mb-10 lg:mb-16">
          {isLive && (
            <div className="flex items-center space-x-3 mb-3">
              <span className="flex w-3 h-3 bg-[#FF0000] rounded-full animate-pulse"></span>
              <span className="text-[#FF0000] font-sans font-bold tracking-widest text-sm">LIVE</span>
            </div>
          )}
          
          <h1 className="text-3xl md:text-5xl lg:text-[56px] font-sans font-bold text-white mb-4 leading-tight" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
          
          <div className="text-gray-400 font-sans md:text-lg mt-4 max-w-4xl" dangerouslySetInnerHTML={{ __html: post.content?.rendered || '' }} />
        </div>

        {/* Телеграм (с отступами) */}
        <div className="px-4 lg:px-18.75 max-w-480 mx-auto">
          <h2 className="text-2xl lg:text-3xl font-sans font-bold text-white mb-6">Обсуждение матча</h2>
          <div className="bg-zinc-900 rounded-3xl lg:rounded-[40px] p-4 lg:p-10 border border-white/5">
            <TelegramWidget postUrl="durov/43" />
          </div>
        </div>
      </div>
    </main>
  );
}