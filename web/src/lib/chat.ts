/** Opens the floating chat box from anywhere, optionally about one ad. */
export const OPEN_CHAT_EVENT = "open-chat";

export interface ChatTopic {
  carId: number;
  title: string;
}

export function openChat(topic?: ChatTopic) {
  window.dispatchEvent(new CustomEvent<ChatTopic | undefined>(OPEN_CHAT_EVENT, { detail: topic }));
}
