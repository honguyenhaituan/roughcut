import type { ArticleContent, Media } from '@/types';

interface Props {
  title: string;
  content: ArticleContent;
  media: Media[];
}

function imageSrc(media: Media[], id: string | null): string | null {
  if (!id) return null;
  return media.find((m) => m.id === id)?.src ?? null;
}

const HEADING =
  'mb-3 text-sm font-semibold tracking-wide text-zinc-400 uppercase';

export function ArticleReader({ title, content, media }: Props) {
  const hero = imageSrc(media, content.heroImageId);

  return (
    <article className="mx-auto max-w-2xl px-6 py-12">
      {hero && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero}
          alt=""
          className="mb-8 w-full rounded-xl object-cover"
        />
      )}

      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        {title}
      </h1>

      {content.hookSubtitle.text && (
        <p className="mt-3 text-lg text-zinc-600">
          {content.hookSubtitle.text}
        </p>
      )}

      {content.intro.text && (
        <p className="mt-6 text-base leading-relaxed text-zinc-800">
          {content.intro.text}
        </p>
      )}

      {content.sections.map((s) => {
        const img = imageSrc(media, s.imageId);
        const body = s.body.map((c) => c.text).join(' ');
        return (
          <section key={s.id} className="mt-10">
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">
              {s.heading}
            </h2>
            {body && (
              <p className="text-base leading-relaxed text-zinc-800">{body}</p>
            )}
            {img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt=""
                className="mt-4 w-full rounded-xl object-cover"
              />
            )}
          </section>
        );
      })}

      {content.keyFacts.length > 0 && (
        <section className="mt-10">
          <h2 className={HEADING}>Key facts</h2>
          <dl className="space-y-2">
            {content.keyFacts.map((kf) => (
              <div key={kf.id} className="flex gap-2 text-sm">
                <dt className="shrink-0 font-medium text-zinc-600">
                  {kf.label}:
                </dt>
                <dd className="text-zinc-800">{kf.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {(content.bestFor.length > 0 || content.notFor.length > 0) && (
        <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {content.bestFor.length > 0 && (
            <div>
              <h2 className={HEADING}>Best for</h2>
              <ul className="space-y-1.5">
                {content.bestFor.map((c) => (
                  <li key={c.id} className="text-sm text-zinc-800">
                    {c.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.notFor.length > 0 && (
            <div>
              <h2 className={HEADING}>Not for</h2>
              <ul className="space-y-1.5">
                {content.notFor.map((c) => (
                  <li key={c.id} className="text-sm text-zinc-800">
                    {c.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {content.ethicsSafety.length > 0 && (
        <section className="mt-10">
          <h2 className={HEADING}>Ethics &amp; safety</h2>
          <ul className="space-y-2">
            {content.ethicsSafety.map((c) => (
              <li key={c.id} className="text-sm text-zinc-800">
                {c.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.topTips.length > 0 && (
        <section className="mt-10">
          <h2 className={HEADING}>Top tips</h2>
          <ul className="space-y-2">
            {content.topTips.map((c) => (
              <li key={c.id} className="text-sm text-zinc-800">
                {c.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.faq.length > 0 && (
        <section className="mt-10">
          <h2 className={HEADING}>FAQ</h2>
          <dl className="space-y-4">
            {content.faq.map((f) => (
              <div key={f.id}>
                <dt className="mb-1 font-medium text-zinc-700">{f.q}</dt>
                <dd className="text-sm text-zinc-800">{f.a.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  );
}
