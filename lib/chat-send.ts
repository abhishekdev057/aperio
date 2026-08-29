import "server-only";

import { getThreadForSend, recordMessage, storeMedia, updateMessageStatus, type MessageKind } from "@/lib/chat";
import { sendUserbotMessage } from "@/lib/telegram-userbot";
import { getWhatsAppConfig, sendWhatsAppMedia, sendWhatsAppText, uploadWhatsAppMedia } from "@/lib/whatsapp";

function kindForMime(mime: string): MessageKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

export async function sendChatMessage(
  threadId: string,
  input: { text?: string; file?: { data: Buffer; mime: string; name: string } },
) {
  const thread = await getThreadForSend(threadId);
  if (!thread) throw new Error("THREAD_NOT_FOUND");
  if (!input.text?.trim() && !input.file) throw new Error("EMPTY_MESSAGE");

  const kind: MessageKind = input.file ? kindForMime(input.file.mime) : "text";
  const mediaId = input.file ? await storeMedia({ mime: input.file.mime, name: input.file.name, data: input.file.data }) : null;

  const messageId = await recordMessage({
    threadId,
    direction: "out",
    kind,
    text: input.text?.trim() || null,
    mediaId,
    mediaMime: input.file?.mime ?? null,
    mediaName: input.file?.name ?? null,
    mediaSize: input.file?.data.length ?? null,
    senderName: "You",
    status: "pending",
  });

  try {
    let externalId: string | null = null;
    if (thread.channel === "telegram_userbot") {
      const res = await sendUserbotMessage(threadId, { text: input.text, file: input.file });
      externalId = res.externalId;
    } else if (thread.channel === "whatsapp") {
      const cfg = await getWhatsAppConfig();
      if (!cfg.configured) throw new Error("WHATSAPP_NOT_CONFIGURED");
      if (input.file) {
        const mid = await uploadWhatsAppMedia(input.file.data, input.file.mime, input.file.name);
        const res = await sendWhatsAppMedia(thread.peerId, mid, input.file.mime, { caption: input.text, filename: input.file.name });
        externalId = res.externalId;
      } else {
        const res = await sendWhatsAppText(thread.peerId, input.text ?? "");
        externalId = res.externalId;
      }
    }
    await updateMessageStatus(messageId!, "sent");
    return { id: messageId, externalId, status: "sent" as const };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "send failed";
    if (messageId) await updateMessageStatus(messageId, "failed", detail);
    throw new Error(detail);
  }
}
