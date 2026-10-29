"use client";
import {P5Estimator} from '@/components/P5Estimator';
/**
 * D2 sole RE-10 home: document intake (upload + confirm list), no on-screen price.
 * Chunked extract pipeline lives under server/services/re10Extract (ported from
 * remodeling). Public mode is review/intake via intakePolicy.
 */
export function Re10Wizard(){
  return (
    <section id="re10-wizard" style={{padding:'24px 16px',minWidth:0}}>
      <P5Estimator headingAs="h2" defaultService="re10" layout="embedded"/>
    </section>
  );
}
