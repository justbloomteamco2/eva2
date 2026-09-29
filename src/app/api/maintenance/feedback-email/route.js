import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendCreatorApplicationCsvEmail, sendFeedbackCsvEmail } from "../../../../lib/feedback-email";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 50;

function isAuthorized(request) {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") || "";
  if (!expected || !authorization.startsWith("Bearer ")) return false;

  const expectedToken = Buffer.from(expected);
  const providedToken = Buffer.from(authorization.slice(7));
  if (expectedToken.length < 32 || providedToken.length !== expectedToken.length) return false;
  return timingSafeEqual(providedToken, expectedToken);
}

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request) {
  if (!isAuthorized(request)) return json({ error: "Maintenance authorization is required." }, 401);

  try {
    const client = getSupabaseAdmin();
    const sources = [
      {
        table: "feedback",
        select: "id,feedback_type,name,attendee_email,attendee_phone,client_project,event,event_date,rating,would_attend_again,what_went_well,what_to_improve,message,media_paths,created_at",
        send: (record) => sendFeedbackCsvEmail(record, client)
      },
      {
        table: "creator_registrations",
        select: "id,name,phone,email,city,age,category,instagram,portfolio,audience_size,languages,skills,interests,created_at",
        send: sendCreatorApplicationCsvEmail
      }
    ];
    const result = {};
    let totalFailed = 0;

    for (const source of sources) {
      const { data: records, error } = await client.from(source.table)
        .select(source.select)
        .is("email_sent_at", null)
        .order("email_attempted_at", { ascending: true, nullsFirst: true })
        .order("created_at", { ascending: true })
        .limit(BATCH_SIZE);
      if (error) throw new Error(`Pending ${source.table} email listing failed: ${error.message}`);

      let sent = 0;
      let failed = 0;
      for (const record of records || []) {
        try {
          const { error: attemptError } = await client.from(source.table)
            .update({ email_attempted_at: new Date().toISOString() })
            .eq("id", record.id)
            .is("email_sent_at", null);
          if (attemptError) throw new Error(`${source.table} email attempt could not be saved: ${attemptError.message}`);

          await source.send(record);
          const { error: updateError } = await client.from(source.table)
            .update({ email_sent_at: new Date().toISOString() })
            .eq("id", record.id)
            .is("email_sent_at", null);
          if (updateError) throw new Error(`${source.table} email status could not be saved: ${updateError.message}`);
          sent += 1;
        } catch (emailError) {
          failed += 1;
          console.error(`${source.table} email delivery failed:`, emailError.message);
        }
      }
      result[source.table] = { sent, failed };
      totalFailed += failed;
    }

    return json({ ok: true, ...result }, totalFailed > 0 ? 503 : 200);
  } catch (error) {
    console.error("Pending feedback email retry failed:", error.message);
    return json({ error: "Pending feedback email delivery is temporarily unavailable." }, 503);
  }
}
