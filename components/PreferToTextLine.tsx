import { SITE_CONFIG } from "@/shared/siteConfig";
import { TEXT_REPLY_HOURS, TEXT_REPLY_LINE, TEXT_SMS_HREF } from "@/shared/textReply";

/** The Prefer-to-text sentence, with the phone number as an sms: link. */
export function PreferToTextLine({ className }: { className?: string }) {
  return (
    <span className={className} data-testid="prefer-to-text">
      Prefer to text? Text{" "}
      <a href={TEXT_SMS_HREF} className="underline underline-offset-2">
        {SITE_CONFIG.phone}
      </a>
      . We reply in minutes during business hours ({TEXT_REPLY_HOURS}).
    </span>
  );
}

/** Linkifies the phone inside an existing string that already includes TEXT_REPLY_LINE. */
export function WithTextReplyLink({ text }: { text: string }) {
  const at = text.indexOf(TEXT_REPLY_LINE);
  if (at < 0) return <>{text}</>;
  const phoneAt = at + TEXT_REPLY_LINE.indexOf(SITE_CONFIG.phone);
  return (
    <>
      {text.slice(0, phoneAt)}
      <a href={TEXT_SMS_HREF} className="underline underline-offset-2">
        {SITE_CONFIG.phone}
      </a>
      {text.slice(phoneAt + SITE_CONFIG.phone.length)}
    </>
  );
}
