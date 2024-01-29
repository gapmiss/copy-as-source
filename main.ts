import { MarkdownView, Notice, Plugin, TFile } from 'obsidian';
import * as prettier from "prettier/standalone";
import * as htmlPlugin from "prettier/plugins/html";

export default class CopySource extends Plugin {

  async onload() {

    this.addCommand({
      id: 'copy-selection-as-source',
      name: 'Copy selection source',
      checkCallback: (checking: boolean) => {
        const file: TFile|null = this.app.workspace.getActiveFile();
        if (file) {
          let markdownView: MarkdownView|null = this.app.workspace.getActiveViewOfType(MarkdownView);
          let isPreviewMode: boolean = markdownView?.getMode() === "preview";
          if (isPreviewMode) {
            if (!checking) {
              let selectedSource: string = this.getSelectionHtml();
              if (selectedSource !== "") {
                this.prettifyCopy(selectedSource, file);
              } else {
                new Notice("No selection found");
                return;
              }
            }
            return true;
          }
        }
      }
    });

    console.log("copy-as-source loaded");
  }

  onunload() {
    console.log("copy-as-source unloaded");
  }

  async copyStringToClipboard(text:string, topic:string|undefined=undefined) {
    navigator.clipboard
      .writeText(text)
      .catch(function (error) {
        new Notice('Failed to copy to clipboard: ' + error, 0);
      });
  }

  getSelectionHtml = () => {
    let html: string = "";
    if (typeof activeDocument.getSelection !== "undefined") {
      let sel: Selection|null = activeDocument.getSelection();
      if (sel?.rangeCount) {
        let container: HTMLDivElement = activeDocument.createElement("div");
        for (let i: number = 0, len = sel.rangeCount; i < len; ++i) {
          container.appendChild(sel.getRangeAt(i).cloneContents());
        }
        html = container.innerHTML;
        container.detach();
      }
    }
    return html;
  }

  prettifyCopy = async (src: string, f: TFile) => {
    /**
     * derived from https://github.com/alexgavrusev/obsidian-plugin-prettier-2/blob/master/src/main.ts
     * https://prettier.io/docs/en/options
     */
    await prettier.format(src, {
      filepath: f.path,
      parser: "html",
      bracketSameLine: true,
      printWidth: 1000,
      singleAttributePerLine: true,
      htmlWhitespaceSensitivity: "ignore",
      plugins: [
        htmlPlugin
      ]
    })
    .then((pretty) => {
        let regex:RegExp = /^\s*$(?:\r\n?|\n)/gm;
        // remove empty lines
        let result:string = pretty.replace(regex, "");
        this.copyStringToClipboard(result);
        new Notice("Source copied to clipboard", 3000);
      }
    );
  }

}
