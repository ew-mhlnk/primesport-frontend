import MatchLayout from '@/components/MatchLayout';
import { WPPost } from '@/types';
import Link from 'next/link';

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

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Матч не найден</h1>
          <Link href="/" className="text-blue-500 hover:text-blue-400 transition-colors">
            Вернуться на главную
          </Link>
        </div>
      </main>
    );
  }

  return <MatchLayout post={post} />;
}