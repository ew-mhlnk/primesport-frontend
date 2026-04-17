/* eslint-disable @next/next/no-img-element */
'use client';

import { motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { WPPost } from '@/types'; 

export default function BroadcastCarousel({ posts }: { posts: WPPost[] }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const[width, setWidth] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
    }
  }, [posts]);

  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-12 md:py-20 px-4 md:px-16 max-w-[100vw] overflow-hidden">
      <h2 className="text-2xl md:text-4xl font-bold text-white mb-8">Все трансляции</h2>
      
      <motion.div ref={carouselRef} className="cursor-grab overflow-hidden">
        <motion.div 
          drag="x" 
          dragConstraints={{ right: 0, left: -width }} 
          className="flex space-x-6"
        >
          {posts.map((post) => {
            const isLive = post.acf?.match_status === 'live' || post.acf?.is_live;
            const featuredImageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url 
              || (typeof post.acf?.match_cover === 'string' ? post.acf.match_cover : undefined)
              || post.acf?.cover_image;

            return (
              <Link href={`/match/${post.id}`} key={post.id} className="shrink-0">
                <motion.div 
                  className="min-w-75 md:min-w-[384px] h-64 bg-zinc-800 border border-zinc-700 rounded-[40px] relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
                >
                  {/* Выводим картинку на фон, если она есть */}
                  {featuredImageUrl && (
                    <img 
                      src={featuredImageUrl} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />
                  
                  <div className="absolute bottom-6 left-6 right-6 text-white z-10">
                    <p 
                      className="font-bold text-xl line-clamp-2 drop-shadow-md" 
                      dangerouslySetInnerHTML={{ __html: post.title.rendered }} 
                    />
                    {isLive && (
                      <p className="text-sm font-medium text-red-500 mt-2 drop-shadow-md">LIVE</p>
                    )}
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}