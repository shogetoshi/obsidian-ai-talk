import {
  App,
  Editor,
  MarkdownView,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";
import OpenAI from "openai";

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

async function getAnswer(apiKey: string): Promise<string> {
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const response = await openai.chat.completions.create({
    //model: "chatgpt-4o-latest",
    model: "gpt-4-turbo",
    messages: [
      { role: "user", content: "pythonでフィボナッチ家数の計算コード書いて" },
    ],
  });
  return response.choices[0].message.content ?? "";
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
          const answer = await getAnswer(this.settings.apiKey);
          editor.setValue(`${currentText}\n${answer}`);
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
