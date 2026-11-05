'use client';

import { useEffect, useRef, useState } from 'react';

const MEDIA = '/media/handyman/boise-handyman-co-';
const POSTER = `${MEDIA}poster.jpg`;
const PHONE_VIDEO = `${MEDIA}background-720p.mp4`;
const DESKTOP_VIDEO = `${MEDIA}background-1080p.mp4`;

/** Native autoplay is eligible in the first response; the poster covers technical failures. */
export function HandymanHeroVideo() {
  const media = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = video.current;
    if (!element || failed) return;
    let desktop = window.innerWidth >= 1024;
    const initialSource = desktop ? DESKTOP_VIDEO : PHONE_VIDEO;
    // Native playback may start before hydration and an early viewport change.
    if (element.currentSrc && !element.currentSrc.endsWith(initialSource)) {
      element.src = initialSource;
      element.load();
    }
    const shouldPlay = () => {
      const bounds = media.current?.getBoundingClientRect();
      return document.visibilityState === 'visible' && Boolean(bounds &&
        bounds.bottom > 0 && bounds.top < window.innerHeight &&
        bounds.right > 0 && bounds.left < window.innerWidth);
    };
    const update = () => {
      if (!shouldPlay()) {
        element.pause();
        return;
      }
      element.muted = true;
      void element.play().then(() => {
        // A late autoplay completion must not restart hidden/offscreen media.
        if (!shouldPlay()) element.pause();
      }).catch(() => {
        // Browser-enforced autoplay restrictions retain the native poster.
      });
    };
    const resize = () => {
      const nextDesktop = window.innerWidth >= 1024;
      if (nextDesktop !== desktop) {
        desktop = nextDesktop;
        // Some browsers retain the previous <source> selection after resize.
        element.src = desktop ? DESKTOP_VIDEO : PHONE_VIDEO;
        element.load();
      }
      update();
    };
    const playing = () => { if (!shouldPlay()) element.pause(); };
    const observer = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(update, { threshold: [0, 0.05] }) : null;
    if (media.current) observer?.observe(media.current);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', update, { passive: true });
    element.addEventListener('playing', playing);
    update();
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', update);
      element.removeEventListener('playing', playing);
      element.pause();
    };
  }, [failed]);

  return (
    <div ref={media} className="fam-hero-media" aria-hidden="true">
      {/* The approved poster is immediately readable, including while loading. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img data-hero-poster="" src={POSTER} alt="" width={1920} height={1080}
        fetchPriority="high" loading="eager" className="fam-hero-img" />
      <video ref={video} id="handyman-hero-video" poster={POSTER}
        autoPlay muted loop playsInline preload="auto" tabIndex={-1}
        disablePictureInPicture hidden={failed} className="handyman-hero-video"
        onError={event => { if (event.currentTarget.error) setFailed(true); }}>
        <source media="(min-width: 1024px)" src={DESKTOP_VIDEO} type="video/mp4" />
        <source src={PHONE_VIDEO} type="video/mp4" />
      </video>
    </div>
  );
}
