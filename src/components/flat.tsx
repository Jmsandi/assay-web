import type { ShieldCheck } from 'lucide-react'

type Icon = typeof ShieldCheck

/** A flat item: a rule on top, an icon, a title and a line of text. No box. */
export function FlatItem({ icon: Icon, title, body, label, dark = false }: { icon?: Icon; title: string; body: string; label?: string; dark?: boolean }) {
  return (
    <div className={dark ? 'border-t border-white/15 pt-5' : 'border-t border-line pt-5'}>
      {label && <p className={dark ? 'text-[11px] font-extrabold tracking-[0.16em] text-brand-300' : 'text-[11px] font-extrabold tracking-[0.16em] text-brand-600'}>{label}</p>}
      {Icon && <Icon className={dark ? 'mt-3 size-5 text-brand-300' : 'mt-3 size-5 text-brand-600'} />}
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className={dark ? 'mt-2 text-sm leading-7 text-white/65' : 'mt-2 text-sm leading-7 text-muted'}>{body}</p>
    </div>
  )
}
