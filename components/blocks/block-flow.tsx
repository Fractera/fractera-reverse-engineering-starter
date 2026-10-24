import type { CSSProperties } from 'react'
import { H3, P } from '@/components/ui/typography'
import { inline } from '@/lib/blocks/inline'
import { SectionHead } from '@/components/blocks/block-section-head'

// Как это работает: три шага, одно вытекает из другого. Стили `.flow*` — в дизайн-системе (globals.css).
type Step = { title: string; text: string }
export type FlowProps = { blockKey?: string; badge?: string; title: string; note?: string; steps: [Step, Step, Step] }

export function Flow({ blockKey: k = 'flow', badge, title, note, steps }: FlowProps) {
  return (
    <section data-block="gmmae" aria-labelledby={`${k}-t`} className="my-10">
      <SectionHead id={`${k}-t`} badge={badge} title={title} note={note ? inline(note, `${k}-n`) : undefined} />
      <ol data-block="xzhm1" className="flow relative mt-8 grid list-none gap-8 p-0 md:gap-6" style={{ '--flow-n': steps.length } as CSSProperties}>
        {steps.map((s, i) => (
          <li data-block="waxch" key={`${k}-${i}`} className="flow-step relative flex flex-col gap-4" style={{ '--flow-i': i } as CSSProperties}>
            <span aria-hidden className="flow-node relative z-10 flex size-14 self-center items-center justify-center rounded-full border font-semibold">{i + 1}</span>
            <div data-block="hllje" className="flow-card w-full flex-1 rounded-2xl border p-5">
              <H3 data-block="qaami">{s.title}</H3>
              <P data-block="da0lx" className="mt-2">{inline(s.text, `${k}-${i}-b`)}</P>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
