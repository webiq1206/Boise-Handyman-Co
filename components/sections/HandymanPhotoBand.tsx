interface HandymanPhotoBandProps {
  src: string;
  alt: string;
  title: string;
  eyebrow?: string;
}

/** Full-bleed photography rhythm band between homepage sections. */
export function HandymanPhotoBand({ src, alt, title, eyebrow }: HandymanPhotoBandProps) {
  return (
    <aside className="hm-photo-band" aria-label={title}>
      <img src={src} alt={alt} loading="lazy" width={1600} height={900} decoding="async" />
      <div className="hm-photo-band-caption">
        <p>{title}</p>
        {eyebrow ? <span>{eyebrow}</span> : null}
      </div>
    </aside>
  );
}
