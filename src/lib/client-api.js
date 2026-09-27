export async function readApiResponse(response) {
  try {
    return await response.json();
  } catch {
    throw new Error(response.ok
      ? "The server returned an invalid response. Please try again."
      : "The server could not complete this request. Please try again.");
  }
}
