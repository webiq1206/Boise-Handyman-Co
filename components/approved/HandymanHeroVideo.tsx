'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const MEDIA = '/media/handyman/boise-handyman-co-';
const POSTER = `${MEDIA}poster.jpg`;
const PHONE_VIDEO = `${MEDIA}background-720p.mp4`;
const DESKTOP_VIDEO = `${MEDIA}background-1080p.mp4`;

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

/** The first response contains a poster; motion is optional decoration. */
export function HandymanHeroVideo() {
  const media = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const wantsPlayback = useRef(false);
  const playGeneration = useRef(0);
  const [ready, setReady] = useState(false);
  const [restricted, setRestricted] = useState(true);
  const [manual, setManual] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playRequest, setPlayRequest] = useState(0);
  const enabled = ready && (!restricted || manual) && !failed;
  const source = enabled ? (desktop ? DESKTOP_VIDEO : PHONE_VIDEO) : undefined;

  useEffect(() => {
    // Older browsers keep the immediate poster without initializing motion.
    if (typeof IntersectionObserver === 'undefined' || typeof matchMedia !== 'function') return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const size = matchMedia('(min-width: 1024px)');
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    const preferences = () => {
      setRestricted(motion.matches || Boolean(connection?.saveData) || /^(slow-)?2g$/.test(connection?.effectiveType ?? ''));
      // A changed browser preference takes effect even after manual playback.
      setManual(false);
    };
    const resize = () => setDesktop(size.matches);
    const visibility = () => setVisible(document.visibilityState === 'visible');
    preferences();
    resize();
    visibility();
    setReady(true);
    motion.addEventListener('change', preferences);
    size.addEventListener('change', resize);
    connection?.addEventListener('change', preferences);
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    if (media.current) observer.observe(media.current);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', preferences);
      size.removeEventListener('change', resize);
      connection?.removeEventListener('change', preferences);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    setHasFrame(false);
    setPlaying(false);
    element.load();
    return () => element.pause();
  }, [source]);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const request = ++playGeneration.current;
    wantsPlayback.current = Boolean(source && !userPaused && inView && visible);
    if (!source || userPaused || !inView || !visible) {
      element.pause();
      return;
    }
    element.muted = true;
    void element.play().then(() => {
      // An autoplay promise may settle after a pause, preference or visibility
      // change. A stale request must never restart decoration against intent.
      if (request === playGeneration.current && !wantsPlayback.current) element.pause();
    }).catch(() => {
      if (request === playGeneration.current && element.paused) setPlaying(false);
    });
    return () => {
      playGeneration.current += 1;
      wantsPlayback.current = false;
      element.pause();
    };
  }, [source, userPaused, inView, visible, playRequest]);

  const toggle = () => {
    if (video.current && !video.current.paused) {
      wantsPlayback.current = false;
      setUserPaused(true);
      video.current?.pause();
    } else {
      setManual(true);
      setUserPaused(false);
      setPlayRequest(value => value + 1);
    }
  };

  return (
    <>
      <div ref={media} className="fam-hero-media" aria-hidden="true">
        {/* The approved poster is immediately readable with JavaScript disabled. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-hero-poster="" src={POSTER} alt="" width={1920} height={1080}
          fetchPriority="high" loading="eager" className="fam-hero-img" />
        <video ref={video} id="handyman-hero-video" src={source} poster={POSTER}
          muted loop playsInline preload="none" tabIndex={-1} disablePictureInPicture
          className="handyman-hero-video" data-has-frame={hasFrame}
          onPlaying={event => {
            if (!wantsPlayback.current) { event.currentTarget.pause(); return; }
            setPlaying(true);
            setHasFrame(true);
          }}
          onPause={event => { if (event.currentTarget.paused) setPlaying(false); }}
          onError={event => {
            if (!event.currentTarget.error) return;
            setFailed(true);
            setPlaying(false);
            setHasFrame(false);
          }} />
      </div>
      {ready && !failed ? (
        <button type="button" className="handyman-hero-video-control" onClick={toggle}
          aria-controls="handyman-hero-video"
          aria-label={playing ? 'Pause background video' : 'Play background video'}>
          {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
        </button>
      ) : null}
    </>
  );
}
