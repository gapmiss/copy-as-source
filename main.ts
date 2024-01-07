import { MarkdownView, Notice, Plugin, TFile, Platform, Menu, MenuItem } from 'obsidian';
import * as prettier from "prettier/standalone";
import * as htmlPlugin from "prettier/plugins/html";

export default class CopySource extends Plugin {

	async onload() {

		this.addCommand({
			id: 'copy-selection-as-source-html',
      name: 'Copy selection as HTML',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
					const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
					const isPreviewMode = markdownView?.getMode() === "preview";
					if (isPreviewMode) {
						if (!checking) {
							let selectedSource = this.getSelectionHtml();
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

		console.log("copy-as-html loaded");
	}

	onunload() {
		console.log("copy-as-html unloaded");
	}

	async copyStringToClipboard(text:string, topic:string|undefined=undefined) {
    navigator.clipboard
      .writeText(text)
      .catch(function (error) {
        new Notice('Failed to copy to clipboard: ' + error, 0);
      });
  }

  getSelectionHtml = () => {
    var html = "";
    if (typeof window.getSelection !== "undefined") {
      var sel = window.getSelection();
      if (sel?.rangeCount) {
        var container = document.createElement("div");
        for (var i = 0, len = sel.rangeCount; i < len; ++i) {
          container.appendChild(sel.getRangeAt(i).cloneContents());
        }
        html = container.innerHTML;
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
				this.copyStringToClipboard(pretty);
				new Notice("HTML copied to clipboard", 3000);
			}
		);
	}

}
