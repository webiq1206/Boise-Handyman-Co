"use client";

/**
 * The request form, server-rendered exactly as before but shipped as its own
 * chunk. Imported directly, ConsultationForm (with react-hook-form, zod, the
 * address lookup and the estimate engines) joined the first-load JavaScript of
 * every route that imports it, and because a visible Link prefetches its
 * route's client modules, the logo link alone made every page download and
 * evaluate the homepage form. Behind next/dynamic the page hydrates first and
 * the form hydrates in its own task when its chunk arrives; the markup, the
 * #consult anchor around it and every data-testid are unchanged.
 */
import dynamic from "next/dynamic";

export const LazyConsultationForm = dynamic(() =>
  import("@/components/ConsultationForm").then((m) => m.ConsultationForm),
);
