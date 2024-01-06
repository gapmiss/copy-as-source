import { MarkdownView, Notice, Plugin, TFile, Platform, Menu, MenuItem } from 'obsidian';
import * as prettier from "prettier/standalone";
import * as htmlPlugin from "prettier/plugins/html";

interface Listener {
	(this: Document, ev: Event): any;
}

export default class MyPlugin extends Plugin {

	async onload() {

		this.addCommand({
			id: 'copy-selection-as-html',
      name: 'Copy selection as HTML',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
					const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
					const isPreviewMode = markdownView?.getMode() === "preview";
					if (isPreviewMode) {
						if (!checking) {
							let selectedSource = this.getSelectionHtml();			
							this.prettifyCopy(selectedSource, file);
						}
						return true;
					}
        }
      }
		});

		if (Platform.isDesktop) {
			this.register(
				this.onElement(
					document,
					"contextmenu" as keyof HTMLElementEventMap,
					"div",
					this.onClick.bind(this)
				)
			);
		}

		console.log("copy-as-html loaded");
	}

	onunload() {
		console.log("copy-as-html unloaded");
	}

	async copyStringToClipboard(text:string, topic:string|undefined=undefined) {
    navigator.clipboard
      .writeText(text)
      .catch(function (error) {
        console.error('Failed to copy to clipboard: ', error)
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

	/**
	 * derived from: https://github.com/byfun/obsidian-image-helper/blob/main/src/main.ts
	 */
	onElement(
		el: Document,
		event: keyof HTMLElementEventMap,
		selector: string,
		listener: Listener,
		options?: { capture?: boolean }
	) {
		el.on(event, selector, listener, options);
		return () => el.off(event, selector, listener, options);
	}
	
	/**
	 * derived from: https://github.com/byfun/obsidian-image-helper/blob/main/src/main.ts
	 */
	onClick(event: MouseEvent) {
		event.preventDefault();
		const target = event.target as Element;
		const nodeType = target.localName;
		const menu = new Menu();
		switch (nodeType) {
			case "h1": 
			case "h2": 
			case "h3": 
			case "h4": 
			case "h5": 
			case "h6": 
			case "hr": 
			case "figure": 
			case "figcaption": 
			case "img": 
			case "svg": 
			case "ul": 
			case "ol": 
			case "li": 
			case "div": 
			case "pre": 
			case "code": 
			case "span": 
			case "p": {
				menu.addItem((item: MenuItem) =>
					item
						.setIcon("copy")
						.setTitle("Copy selection as HTML")
						.onClick(async (ele) => {
							const file = this.app.workspace.getActiveFile()!;
							let selectedSource = this.getSelectionHtml();			
							this.prettifyCopy(selectedSource, file);
						})
				);
				break;
			}
			default:
				return;
		}
		let offset = 0;
		menu.showAtPosition({
			x: event.pageX + offset,
			y: event.pageY + offset,
		});
		this.app.workspace.trigger("html-contextmenu:contextmenu", menu);
	}

}
