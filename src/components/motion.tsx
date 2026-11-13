import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { ImageIcon } from 'lucide-react'
import { cx } from '../lib/format'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True once the element has scrolled into view (and stays true). */
export function useInView<T extends Element>(threshold = 0.18) {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reducedMotion() || !('IntersectionObserver' in window)) {
      setShown(true)
      return
    }
    // Already on screen at load (the hero, the stats band): show it on the next
    // frame without waiting for the observer, so the first view is never blank.
    const box = el.getBoundingClientRect()
    if (box.top < window.innerHeight && box.bottom > 0) {
      const frame = requestAnimationFrame(() => setShown(true))
      const fallback = window.setTimeout(() => setShown(true), 120)
      return () => {
        cancelAnimationFrame(frame)
        window.clearTimeout(fallback)
      }
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, shown] as const
}

type Effect = 'up' | 'left' | 'right' | 'zoom' | 'pop'

/**
 * Animates its children in when scrolled into view. `delay` (ms) staggers items in a
 * group. Nothing moves for people who ask for reduced motion.
 */
export function Reveal({
  children,
  effect = 'up',
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  effect?: Effect
  delay?: number
  className?: string
  as?: ElementType
}) {
  const [ref, shown] = useInView<HTMLDivElement>()
  return (
    <Tag ref={ref} className={cx('reveal', `reveal-${effect}`, shown && 'is-shown', className)} style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  )
}

/** Counts up to `to` once visible. */
export function CountUp({ to, decimals = 0, suffix = '', prefix = '' }: { to: number; decimals?: number; suffix?: string; prefix?: string }) {
  const [ref, shown] = useInView<HTMLSpanElement>(0.5)
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!shown) return
    if (reducedMotion()) {
      setValue(to)
      return
    }
    const start = performance.now()
    const duration = 1400
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(to * (1 - Math.pow(1 - t, 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [shown, to])
  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  )
}

/**
 * A photo slot. Without `src` it shows a labelled placeholder with the suggested
 * size, so it is obvious what goes where; with `src` it shows the image.
 */
export function Photo({ src, alt, label, size, className, rounded = 'rounded-[32px]' }: { src?: string; alt: string; label: string; size: string; className?: string; rounded?: string }) {
  if (src) return <img src={src} alt={alt} loading="lazy" className={cx('h-full w-full object-cover', rounded, className)} />
  return (
    <div role="img" aria-label={`${alt} (placeholder)`} className={cx('relative grid h-full w-full place-items-center overflow-hidden border-2 border-dashed border-[#c9c9cf] bg-[repeating-linear-gradient(135deg,#ececef_0_14px,#f4f4f6_14px_28px)] dark:border-line dark:bg-[repeating-linear-gradient(135deg,#1d1d21_0_14px,#232328_14px_28px)]', rounded, className)}>
      {label ? (
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <span className="grid size-11 place-items-center rounded-2xl bg-panel text-muted shadow-sm">
            <ImageIcon className="size-5" />
          </span>
          <span className="text-sm font-semibold text-ink">{label}</span>
          {size && <span className="text-xs text-muted">{size}</span>}
        </div>
      ) : (
        <ImageIcon className="size-5 text-muted" aria-hidden="true" />
      )}
    </div>
  )
}
