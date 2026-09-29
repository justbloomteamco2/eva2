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

async function sendCsvEmail({
  record, columns, type, filename, subject, text, client, mediaPaths = [], bucket
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FEEDBACK_EMAIL_FROM;
  const recipient = process.env.SUBMISSION_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
  if (!apiKey || !from || !recipient) {
    throw new Error("RESEND_API_KEY, FEEDBACK_EMAIL_FROM and SUBMISSION_NOTIFICATION_EMAIL (or ADMIN_EMAIL) must be configured.");
  }

  let linksText = "";
  if (mediaPaths.length) {
    if (!client) throw new Error("Supabase client is required for private submission attachments.");
    const { data, error } = await client.storage.from(bucket)
      .createSignedUrls(mediaPaths, 60 * 60 * 24 * 7);
    if (error) throw new Error(`Private submission attachment links could not be created: ${error.message}`);
    if (!data || data.length !== mediaPaths.length || data.some((file) => !file.signedUrl)) {
      throw new Error("Private submission attachment links could not be created.");
    }
    linksText = `\n\nPrivate file links (available for 7 days):\n${data.map((file, index) => {
      const fileName = mediaPaths[index].split("/").at(-1);
      return `${fileName}: ${file.signedUrl}`;
    }).join("\n")}`;
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
      text: `${text}${linksText}`,
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

export function sendFeedbackCsvEmail(feedback, client) {
  const isClientFeedback = feedback.feedback_type === "client";
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
    text: `A new ${isClientFeedback ? "client" : "event"} feedback submission is attached as a CSV file.`,
    client,
    mediaPaths: feedback.media_paths || [],
    bucket: "feedback-attachments"
  });
}

export function sendCreatorApplicationCsvEmail(application, client) {
  return sendCsvEmail({
    record: application,
    columns: [
      "id", "name", "phone", "email", "city", "age", "category", "instagram",
      "portfolio", "audience_size", "languages", "skills", "interests", "created_at"
    ],
    type: "creator-application",
    filename: `creator-application-${application.id}.csv`,
    subject: "New creator/job application received",
    text: "A new creator/job application is attached as a CSV file.",
    client,
    mediaPaths: [application.photo_path].filter(Boolean),
    bucket: "creator-photos"
  });
}

export function sendEnquiryCsvEmail(enquiry) {
  return sendCsvEmail({
    record: enquiry,
    columns: ["id", "name", "email", "organisation", "category", "message", "created_at"],
    type: "enquiry",
    filename: `enquiry-${enquiry.id}.csv`,
    subject: "New website enquiry received",
    text: "A new website enquiry is attached as a CSV file."
  });
}

export function sendProjectRegistrationCsvEmail(registration, client) {
  return sendCsvEmail({
    record: registration,
    columns: [
      "id", "reference_number", "project", "full_name", "date_of_birth", "gender", "phone",
      "whatsapp", "email", "city", "state", "category", "instagram", "youtube",
      "other_social_media", "key_skills", "about", "portfolio", "collaboration_interests",
      "preferred_collaborators", "interested_in_future", "preferred_city",
      "preferred_meetup_date", "heard_from", "payment_status", "payment_amount_paise",
      "payment_currency", "created_at"
    ],
    type: "project-registration",
    filename: `project-registration-${registration.reference_number}.csv`,
    subject: registration.project === "ifi"
      ? "New India’s Face Icon registration received"
      : "New Creator Meet-Up registration received",
    text: `A new ${registration.project === "ifi" ? "India’s Face Icon" : "Creator Meet-Up"} registration is attached as a CSV file.`,
    client,
    mediaPaths: [registration.profile_photo_path, ...(registration.additional_photo_paths || [])].filter(Boolean),
    bucket: "project-registration-photos"
  });
}
