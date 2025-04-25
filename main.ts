import {
  App,
  Editor,
  MarkdownView,
  Plugin,
  PluginSettingTab,
  Setting,
  Notice,
} from "obsidian";
import { OpenAI } from "openai";
import {
  gen,
  getConversationTexts,
  getSystemPrompt,
  getMessages,
  getFormattedText,
} from "./utils";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
  apiKey: string;
  systemPrompt: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  apiKey: "",
  systemPrompt: "",
};

function getCurrentEditor(): Editor {
  const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
  if (!activeView) {
  }
  return activeView.editor;
}

function getCurrentText(editor: Editor): string {
  return editor.getValue();
}

function formatBuffer(buffer: string): string {
  return buffer.replace(/\n---\n/g, "");
}

async function askForAI(
  apiKey: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  callback: (chunk: string) => Promise<void>
): Promise<void> {
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const stream = await openai.chat.completions.create({
    model: "o4-mini",
    messages,
    stream: true,
  });

  const freqGen = gen([
    1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584,
  ]);
  let buffer = "";
  let i = 0;
  let currentFreq = freqGen.next().value;
  for await (const chunk of stream) {
    buffer += chunk.choices[0]?.delta?.content || "";
    i++;
    if (currentFreq && i >= currentFreq) {
      callback(formatBuffer(buffer));
      buffer = "";
      i = 0;
      currentFreq = freqGen.next().value;
    }
  }

  if (buffer) {
    callback(formatBuffer(buffer));
  }
}

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "task-with-ai",
      name: "Talk with AI",
      callback: async () => {
        // 今のページのハンドラを取得
        const editor = getCurrentEditor();
        const originalText = getCurrentText(editor);

        // 今のページを解析して順番に保持しておく
        const writtenMessages = getConversationTexts(originalText);
        if (writtenMessages.length % 2 === 1) {
          new Notice(`Talk with AI: Start`);
          // ChatGPT用のmessageを作る
          const messages = [
            getSystemPrompt(this.settings.systemPrompt),
            ...getMessages(writtenMessages),
          ];

          // ChatGPTに投げる
          await askForAI(
            this.settings.apiKey,
            messages,
            async (chunk: string): Promise<void> => {
              // 最初の文章がきたらフォーマットされたテキストに置き換える
              if (getCurrentText(editor) === originalText) {
                editor.setValue(
                  `${getFormattedText(writtenMessages)}\n\n---\n# A\n`
                );
              }
              editor.replaceRange(chunk, {
                line: editor.lastLine() + 1,
                ch: 0,
              });
            }
          );
          editor.replaceRange("\n\n---\n# Q\n", {
            line: editor.lastLine() + 1,
            ch: 0,
          });
          new Notice(`Talk with AI: Finish`);
        }
      },
    });

    this.addCommand({
      id: "delete-last-answer",
      name: "Delete last answer",
      callback: async () => {
        // 今のページのハンドラを取得
        const editor = getCurrentEditor();
        const originalText = getCurrentText(editor);

        // 今のページを解析して順番に保持しておく
        const writtenMessages = getConversationTexts(originalText);

        if (writtenMessages.length >= 2) {
          if (writtenMessages.length % 2 === 0) {
            writtenMessages.pop();
          } else {
            writtenMessages.pop();
            writtenMessages.pop();
          }
          editor.setValue(getFormattedText(writtenMessages));
          new Notice(`Talk with AI: The last answer was deleted.`);
        }
      },
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class SampleSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl).setName("OpenAI API Key").addText((text) => {
      text.inputEl.setAttribute("type", "password");
      return text
        .setPlaceholder("sk-XXXX")
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        });
    });
    new Setting(containerEl).setName("SystemPrompt").addTextArea((text) => {
      text.inputEl.style.width = "400px";
      text.inputEl.style.height = "400px";
      return text
        .setPlaceholder("")
        .setValue(this.plugin.settings.systemPrompt)
        .onChange(async (value) => {
          this.plugin.settings.systemPrompt = value;
          await this.plugin.saveSettings();
        });
    });
  }
}
