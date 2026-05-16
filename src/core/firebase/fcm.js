import { getFirebaseAdmin } from "./firebase.js";

export const sendFCM = async (fcmToken, { title, body, data = {} }) => {
  if (!fcmToken) return null;

  try {
    const messaging = getFirebaseAdmin().messaging();

    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)]),
      ),
      android: {
        priority: "high",
        notification: {
          sound: "default",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
    };
    console.log("sendFCM", message);

    const response = await messaging.send(message);
    console.log("sendFCM", response);

    return response;
  } catch (err) {
    if (
      err.code === "messaging/invalid-registration-token" ||
      err.code === "messaging/registration-token-not-registered"
    ) {
      console.warn(`[FCM] Invalid token — should be removed: ${fcmToken}`);
      return { invalidToken: true };
    }
    console.error("[FCM] Send error:", err.message);
    return null;
  }
};

export const sendFCMBulk = async (fcmTokens, { title, body, data = {} }) => {
  if (!fcmTokens?.length) return { successCount: 0, failureCount: 0 };
  console.log("sendFCMBulk", fcmTokens);
  try {
    const messaging = getFirebaseAdmin().messaging();

    const stringData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)]),
    );

    stringData.title = title;
    stringData.body = body;

    const message = {
      notification: { title, body },
      data: stringData,
      android: {
        priority: "high",
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          title,
          body,
          requireInteraction: true,
        },
      },
    };

    const response = await messaging.sendEachForMulticast({
      ...message,
      tokens: fcmTokens,
    });
    console.log(
      `[FCM] Bulk Success: ${response.successCount} sent, ${response.failureCount} failed`,
    );
    return response;
  } catch (err) {
    console.error("[FCM] Bulk error:", err.message);
    return { successCount: 0, failureCount: fcmTokens.length };
  }
};
