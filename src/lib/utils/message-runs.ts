/**
 * For each message, whether it starts a run: the first of one or more messages
 * in a row from the same sender. Chat threads show the sender's name only
 * there, the way a WhatsApp group does, so the thread names every change of
 * speaker without repeating a name on every bubble.
 */
export function runStarts<T>(items: readonly T[], senderKey: (item: T) => string): boolean[] {
  return items.map((item, i) => i === 0 || senderKey(items[i - 1]) !== senderKey(item));
}
