function csvCell(value) {
  let text = value == null ? "" : String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function createCsv(record, columns) {
  const header = columns.map(csvCell).join(",");
  const row = columns.map((column) => csvCell(record[column])).join(",");
  return `\uFEFF${header}\r\n${row}`;
}

async function sendCsvEmail({ record, columns, type, filename, subject, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FEEDBACK_EMAIL_FROM;
  const recipient = process.env.ADMIN_EMAIL;
  if (!apiKey || !from || !recipient) {
    throw new Error("RESEND_API_KEY, FEEDBACK_EMAIL_FROM and ADMIN_EMAIL must be configured.");
  }

  const csv = createCsv(record, columns);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `${type}/${record.id}`
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject,
      text,
      attachments: [{
        filename,
        content: Buffer.from(csv, "utf8").toString("base64"),
        content_type: "text/csv"
      }]
    }),
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`${type} email provider returned HTTP ${response.status}.`);
  }
}

export async function sendFeedbackCsvEmail(feedback, client) {
  const isClientFeedback = feedback.feedback_type === "client";
  let attachmentText = "";
  if (feedback.media_paths?.length) {
    const { data, error } = await client.storage.from("feedback-attachments")
      .createSignedUrls(feedback.media_paths, 60 * 60 * 24 * 7);
    if (error) throw new Error(`Feedback attachment links could not be created: ${error.message}`);
    if (!data || data.length !== feedback.media_paths.length || data.some((file) => !file.signedUrl)) {
      throw new Error("Feedback attachment links could not be created.");
    }
    attachmentText = `\n\nPrivate media links (available for 7 days):\n${data.map((file, index) => {
      const filename = feedback.media_paths[index].split("/").at(-1);
      return `${filename}: ${file.signedUrl}`;
    }).join("\n")}`;
  }
  return sendCsvEmail({
    record: feedback,
    columns: [
      "id", "feedback_type", "name", "attendee_email", "attendee_phone", "client_project",
      "event", "event_date", "rating", "would_attend_again", "what_went_well",
      "what_to_improve", "message", "media_paths", "created_at"
    ],
    type: isClientFeedback ? "client-feedback" : "feedback",
    filename: `${isClientFeedback ? "client-feedback" : "feedback"}-${feedback.id}.csv`,
    subject: isClientFeedback ? "New client feedback received" : "New event feedback received",
    text: `A new ${isClientFeedback ? "client" : "event"} feedback submission is attached as a CSV file.${attachmentText}`
  });
}

export function sendCreatorApplicationCsvEmail(application) {
  return sendCsvEmail({
    record: application,
    columns: [
      "id", "name", "phone", "email", "city", "age", "category", "instagram",
      "portfolio", "audience_size", "languages", "skills", "interests", "created_at"
    ],
    type: "creator-application",
    filename: `creator-application-${application.id}.csv`,
    subject: "New creator/job application received",
    text: "A new creator/job application is attached as a CSV file. The profile photo remains available in the private application system."
  });
}
