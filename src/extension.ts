import * as vscode from 'vscode';

class Header extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly command: vscode.Command
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}

export class AboutlineProvider implements vscode.TreeDataProvider<Header> {
  private headers: Header[] = [];
  private regex: RegExp;
  private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;

  constructor() {
    // lines that look like '// # <header>'
    this.regex = /^.*\/\/ # (.*)$/gm;

    vscode.workspace.onDidChangeTextDocument(e => {
      this.updateHeaders(e.document);
    });

    vscode.window.onDidChangeActiveTextEditor(textEditor => {
      if (textEditor) {
        this.updateHeaders(textEditor.document);
      } else {
        this.updateHeaders();
      }
    });
  }

  updateHeaders(document?: vscode.TextDocument) {
    this.headers = [];
    if (document) {
      const regex = new RegExp(this.regex);
      const text = document.getText();
      let matches;
      while ((matches = regex.exec(text)) !== null) {
        const range = document.lineAt(document.positionAt(matches.index).line).range;
        const command: vscode.Command = {
          title: '',
          command: 'extension.gotoRange',
          arguments: [range]
        };
        this.headers.push(new Header(matches[1], command));
      }
    }
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Header): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Header): Thenable<Header[]> {
    return Promise.resolve(this.headers);
  }
}

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.registerCommand('extension.gotoRange', range => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      editor.selection = new vscode.Selection(range.start, range.end);
      editor.revealRange(range);
    }
  });

  const aboutlineProvider = new AboutlineProvider();
  if (vscode.window.activeTextEditor) {
    aboutlineProvider.updateHeaders(vscode.window.activeTextEditor.document);
  }
  const treeView = vscode.window.createTreeView('aboutline', {
    treeDataProvider: aboutlineProvider
  });
  context.subscriptions.push(treeView);
}

export function deactivate() {}
