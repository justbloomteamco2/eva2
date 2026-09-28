export const enquiryCategories = [
  "Brand partnership",
  "Event production",
  "Creator campaign",
  "Creator collaboration",
  "Campus partnership",
  "Bardapure Creators Meet-Up",
  "India’s Face Icon – IFI",
  "Film / production enquiry",
  "Something else"
];

export const enquirySubmissionCategories = [...enquiryCategories, "Joining the network"];

export function isEnquiryCategory(value) {
  return enquiryCategories.includes(value);
}
