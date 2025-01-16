import {
  App,
  Editor,
  MarkdownView,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  dangerouslyAllowBrowser: true,
});

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: "default",
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

async function getAnswer(): Promise<string> {
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
      async (evt: MouseEvent) => {
        {
          const editor = getCurrentEditor();
          const currentText = getCurrentText(editor);
          const answer = await getAnswer();
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

    new Setting(containerEl)
      .setName("Setting #1")
      .setDesc("It's a secret")
      .addText((text) =>
        text
          .setPlaceholder("Enter your secret")
          .setValue(this.plugin.settings.mySetting)
          .onChange(async (value) => {
            this.plugin.settings.mySetting = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
