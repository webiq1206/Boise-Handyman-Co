import {projectRequestHold} from './p5LeadIntake.ts';
import type {IntakeDeliveryEnvelope} from './intakeDeliveryPayload.ts';
import type {IntakeDeliveryReason} from './intakeDeliveryPolicy.ts';

/**
 * This specialty site has no lead receiver of its own: a visitor's unpriced project request is posted
 * to P5 Home Co's lead intake (the `crm` channel in intakeDeliveryRuntime.ts; owner decisions, 13, 17
 * and 18 November 2026). So the contract check is the one that channel runs before any post,
 * `projectRequestHold()` in p5LeadIntake.ts: a synthetic QA request is `synthetic-suppressed`, a
 * request nobody could be reached about is `contact-review`, and an envelope that is not a request
 * for the `crm` channel is `payload-review`. It reads the envelope only: no I/O, no side effect.
 */
export function validateIntakeLocalCrm(envelope:IntakeDeliveryEnvelope):IntakeDeliveryReason|null{
 return projectRequestHold(envelope);
}
