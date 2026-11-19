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
 *
 * The id for the form's labels and fields is made here, above the dynamic
 * boundary: next/dynamic renders one more wrapper on the server than in the
 * browser, so an id made inside the form differed between the two and React
 * reported a hydration mismatch on every label and field.
 */
import { useId } from "react";
import dynamic from "next/dynamic";
import type { ConsultationForm } from "@/components/ConsultationForm";

const DynamicConsultationForm = dynamic(() =>
  import("@/components/ConsultationForm").then((m) => m.ConsultationForm),
);

export function LazyConsultationForm(props: Omit<NonNullable<Parameters<typeof ConsultationForm>[0]>, "idPrefix">) {
  const id = useId();
  return <DynamicConsultationForm {...props} idPrefix={id} />;
}
