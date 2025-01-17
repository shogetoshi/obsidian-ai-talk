import {
  App,
  Editor,
  MarkdownView,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";
import { OpenAI } from "openai";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
  apiKey: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  apiKey: "sk-XXXX",
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

function calcMessages(text: string): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [{ role: "user", content: text }];
}

async function askForAI(
  apiKey: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  callback: (chunk: string) => void
): Promise<void> {
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const stream = await openai.chat.completions.create({
    model: "chatgpt-4o-latest",
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) callback(content);
  }
}

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    await this.loadSettings();

    // This creates an icon in the left ribbon.
    const ribbonIconEl = this.addRibbonIcon(
      "dice",
      "Sample Plugin",
      async () => {
        {
          const editor = getCurrentEditor();
          const currentText = getCurrentText(editor);
          const messages = calcMessages(currentText);
          await askForAI(this.settings.apiKey, messages, (chunk: string) => {
            editor.setValue(`${getCurrentText(editor)}${chunk}`);
          });
        }
      }
    );
    // Perform additional things with the ribbon
    ribbonIconEl.addClass("my-plugin-ribbon-class");

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
  }
}
