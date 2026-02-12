import { logEvent } from "firebase/analytics";
import { initAnalytics } from "./firebase";

export async function trackEvent(
  eventName: string,
  params?: Record<string, string | number>
) {
  const analytics = await initAnalytics();
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
}
