import { H2 } from '@/components/ui/typography'
import { inline } from '@/lib/blocks/inline'

// ВОПРОСЫ И ОТВЕТЫ + разметка FAQPage — один источник для видимого блока и для машины: закрыть одно, оставив другое,
// значит пообещать поисковику то, чего на странице нет. Ответ проходит через `inline` (ссылка внутри фразы), вопрос — нет.
export type FaqProps = { blockKey?: string; title: string; items: { q: string; a: string }[] }

const plain = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

export function Faq({ blockKey: k = 'faq', title, items }: FaqProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })),
  }
  return (
    <section data-block="xozzm" aria-labelledby="faq-heading" className="mt-12 border-t border-border pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <H2 data-block="pc104" id="faq-heading">{title}</H2>
      <dl data-block="qvtai" className="mt-6 flex flex-col gap-4">
        {items.map((f, i) => (
          <div data-block="e9eo5" key={`${k}-${i}`} className="rounded-2xl border border-border bg-muted/40 p-5">
            <dt data-block="nnyab" className="text-base font-semibold text-foreground">{f.q}</dt>
            <dd data-block="q2scr" className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{inline(f.a, `${k}-${i}`)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
