import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/server/auth';
import { articleService } from '@/server/services/article.service';
import { AppHeader } from '@/components/AppHeader';
import { logout } from './login/actions';

type ArticleStatus = 'planned' | 'drafting' | 'ready';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<ArticleStatus, string> = {
    planned: 'bg-zinc-100 text-zinc-600',
    drafting: 'bg-amber-100 text-amber-700',
    ready: 'bg-green-100 text-green-700',
  };
  const labels: Record<ArticleStatus, string> = {
    planned: 'Planned',
    drafting: 'Drafting',
    ready: 'Ready',
  };
  const s = status as ArticleStatus;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[s] ?? 'bg-zinc-100 text-zinc-600'}`}
    >
      {labels[s] ?? status}
    </span>
  );
}

export default async function LibraryPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const articles = await articleService.list(user.userId);

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppHeader
        right={
          <>
            <span className="hidden text-sm text-zinc-500 sm:block">
              {user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                Log out
              </button>
            </form>
          </>
        }
      />

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Page title + New article action */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Your articles
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {articles.length === 0
                ? 'Turn rough travel notes into grounded articles.'
                : `${articles.length} article${articles.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            href="/new"
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            New article
          </Link>
        </div>

        {articles.length === 0 ? (
          /* Empty state */
          <div className="rounded-xl border border-zinc-200 bg-white px-8 py-16 text-center">
            <p className="text-lg font-medium text-zinc-800">No articles yet</p>
            <p className="mt-2 text-sm text-zinc-500">
              Upload your rough notes to draft your first article.
            </p>
            <Link
              href="/new"
              className="mt-6 inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              New article
            </Link>
          </div>
        ) : (
          /* Article grid */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/articles/${a.id}`}
                className="group flex min-h-32 flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <p className="mb-4 line-clamp-3 text-sm leading-relaxed font-medium text-zinc-900">
                  {a.title || 'Untitled'}
                </p>
                <div className="flex items-center justify-between">
                  <StatusBadge status={a.status} />
                  <span className="text-xs text-zinc-400">
                    {new Date(a.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
