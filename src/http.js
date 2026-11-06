import { IkirereError, EXIT } from "./errors.js";
import { config } from "./config.js";

export async function fetchJson(url, timeoutMs = config.timeoutMs) {
  let response;

  try {
    response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    if (err.name === "TimeoutError") {
      throw new IkirereError(
        `The weather service did not respond within ${timeoutMs / 1000} seconds. Please try again.`,
        EXIT.NETWORK
      );
    }
    throw new IkirereError(
      "Could not reach the weather service. Check your internet connection.",
      EXIT.NETWORK
    );
  }

  if (!response.ok) {
    throw new IkirereError(
      `The weather service returned an error (status ${response.status}). Try again later.`,
      EXIT.SERVICE
    );
  }

  try {
    return await response.json();
  } catch {
    throw new IkirereError("The weather service sent back data we could not read.", EXIT.SERVICE);
  }
}