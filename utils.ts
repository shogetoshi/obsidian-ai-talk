import { OpenAI } from "openai";

export function* gen<T>(array: T[]): Generator<T> {
  for (const item of array) {
    yield item;
  }
}

export function isSimpleQuestion(text: string): boolean {
  for (const line of text.trim().split("\n")) {
    if (line.match(/^# \w/)) return false;
  }
  return true;
}

export function isValidConversation(text: string): boolean {
  return true;
}

function formatMessage(message: string): string {
  if (message.startsWith("#### ")) message = message.slice(5);
  return message.trim();
}

export function getTexts(text: string): string[] {
  const messages = [];
  let message = "";
  const lines = text.split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^---$/) && lines[i + 1].match(/# [QA]$/)) {
      messages.push(formatMessage(message));
      message = "";
      i++;
      continue;
    }
    message += line + "\n";
  }
  if (message.trim().length > 0) messages.push(formatMessage(message));
  return messages;
}

export function getConversationTexts(text: string): string[] {
  // 構造を持たないテキストは単独の質問とみなす
  if (isSimpleQuestion(text)) return [text.trim()];

  // 会話構造のチェック
  //assert(isValidConversation(text));

  return getTexts(text);
}

export function getMessages(
  texts: string[]
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return texts.map((text, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: text,
  }));
}

export function getFormattedText(writtenMessages: string[]): string {
  const comments = writtenMessages.map((text, i) => {
    return `${i % 2 === 0 ? "# Q\n#### " : "# A\n"}${text}`;
  });
  return comments.join("\n\n---\n");
}
