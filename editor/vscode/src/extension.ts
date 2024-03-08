import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import * as net from 'net';
import * as readline from 'readline';

export function activate(context: vscode.ExtensionContext) {
	let controller: ServiceController | undefined;
	let wordCount = false;
	let wordCountAll = false;
	let activateCurrent = false;
	let activateAlways = false;

	createSevice(context.extensionUri).then((service) => {
		controller = new ServiceController(service, context.extensionUri);
		context.subscriptions.push(controller);
		if (wordCount) controller.wordCount();
		if (wordCountAll) controller.wordCountAll();
		if (activateCurrent) controller.activateCurrent();
		if (activateAlways) controller.activateAlways();
	}).catch((error) => vscode.window.showErrorMessage(error))

	let wordCountCommand = vscode.commands.registerCommand('simple-word-count.wordCount', () => {
		if (controller) controller.wordCount();
		else wordCount = true;
	});
	let wordCountAllCommand = vscode.commands.registerCommand('simple-word-count.wordCountAll', () => {
		if (controller) controller.wordCountAll();
		else wordCountAll = true;
	});
	let activateCurrentCommand = vscode.commands.registerCommand('simple-word-count.activateCurrent', () => {
		if (controller) controller.activateCurrent();
		else activateCurrent = true;
	});
	let activateAlwaysCommand = vscode.commands.registerCommand('simple-word-count.activateAlways', () => {
		if (controller) controller.activateAlways();
		else activateAlways = true;
	});

	context.subscriptions.push(wordCountCommand);
	context.subscriptions.push(wordCountAllCommand);
	context.subscriptions.push(activateCurrentCommand);
	context.subscriptions.push(activateAlwaysCommand);
}

export function deactivate() { }


class ServiceController {
	private service: Service;
	private activedTextEditor: vscode.TextEditor | undefined;
	private activateFileExtensions: string[] = [];
	private activateUntitled = false;
	private showLine = false;
	private showSelection = false;
	private selectionShowDelay = 300;
	private statusBarItemPriority = 100;
	private selectionTimeout: NodeJS.Timeout | undefined;
	private statusBarItem: vscode.StatusBarItem;
	private activateFiles: string[] = [];
	private alwaysActive = false;
	private selectionCount: string | undefined;
	private totalCount: string | undefined;
	private panel: vscode.WebviewPanel | undefined;
	private shouldSpin = false;
	private extensionUri: vscode.Uri;

	constructor(service: Service, extensionUri: vscode.Uri) {
		this.loadConfig();
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, this.statusBarItemPriority);
		this.statusBarItem.command = "simple-word-count.wordCountAll";
		this.statusBarItem.tooltip = "statistics";
		this.service = service;
		this.activedTextEditor = vscode.window.activeTextEditor;
		this.extensionUri = extensionUri;

		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('SimpleWordCount'))
				this.loadConfig();
		})
		vscode.window.onDidChangeActiveTextEditor((e) => {
			this.activedTextEditor = e;
			this.totalCount = undefined;
			this.selectionCount = undefined;
			this.updateStatusBarItem();
			this.updateTotalCount();
		})
		vscode.workspace.onDidChangeTextDocument((e) => this.updateTotalCount())
		vscode.window.onDidChangeTextEditorSelection((e) => this.updateSelectionCount(e));

		this.updateTotalCount();
	}

	private loadConfig() {
		const config = vscode.workspace.getConfiguration('SimpleWordCount');
		this.activateFileExtensions = (config.get('ActivateFileExtensions') as string ?? ".txt;.md")
			.toLocaleLowerCase().split(';').filter((f) => f.length > 0);
		this.activateUntitled = config.get('ActivateUntitled') ?? true;
		this.showSelection = config.get('ShowSelection') ?? true;
		this.showLine = config.get('ShowLine') ?? true;
		this.selectionShowDelay = config.get('SelectionShowDelay') ?? 300;
		this.statusBarItemPriority = config.get('StatusBarItemPriority') ?? 100;
	}

	private updateStatusBarItem() {
		if (this.totalCount) {
			const icon = this.shouldSpin ? "$(sync~spin)" : "$(note)"
			if (this.selectionCount)
				this.statusBarItem.text = `${icon} ${this.selectionCount}/${this.totalCount}`;
			else
				this.statusBarItem.text = `${icon} ${this.totalCount}`;
			this.statusBarItem.show();
		} else
			this.statusBarItem.hide();
	}

	private updateTotalCount() {
		if (this.activedTextEditor && this.shouldActivate())
			this.service.countTextStr(this.activedTextEditor.document.getText(), (n) => {
				this.totalCount = n;
				this.updateStatusBarItem();
			})
	}

	private updateSelectionCount(event: vscode.TextEditorSelectionChangeEvent) {
		if (this.shouldActivate()) {
			if (this.showSelection || this.showLine) {
				let text = "";
				for (let index = 0; index < event.selections.length; index++) {
					const selection = event.selections[index];
					if (selection.isEmpty && this.showLine) {
						text += event.textEditor.document.lineAt(selection.start.line).text + "\n";
					} else if (this.showSelection) {
						text += event.textEditor.document.getText(selection) + "\n";
					}
				}
				text = text.trim();

				if (this.selectionTimeout)
					clearTimeout(this.selectionTimeout);

				if (text.length > 0) {
					this.selectionCount = "?";
					this.updateStatusBarItem();
					this.selectionTimeout = setTimeout(() => {
						this.selectionTimeout = undefined;
						this.service.countTextStr(text, (n) => {
							this.selectionCount = n;
							this.updateStatusBarItem();
						})
					}, this.selectionShowDelay);
				} else {
					this.selectionCount = undefined;
					this.updateStatusBarItem();
				}
			}
		}
	}

	private shouldActivate() {
		if (this.activedTextEditor) {
			if (this.alwaysActive)
				return true;
			if (this.activedTextEditor.document.isUntitled)
				return this.activateUntitled

			const filePath = this.activedTextEditor.document.uri.fsPath;
			const ext = path.extname(filePath).toLocaleLowerCase();
			if (this.activateFileExtensions.includes(ext))
				return true
			if (this.activateFiles.includes(filePath))
				return true;
		}
		return false;
	}

	wordCount() {
		if (this.activedTextEditor)
			this.service.countTextStr(this.activedTextEditor.document.getText(), (n) => vscode.window.showInformationMessage(`${n} words`));
		else
			vscode.window.showWarningMessage('no active text editor');
	}

	wordCountAll() {
		if (this.shouldSpin) return;
		this.shouldSpin = true;
		this.updateStatusBarItem();

		const folders = vscode.workspace.workspaceFolders;
		if (folders) {
			let assetsUri = vscode.Uri.joinPath(this.extensionUri, "assets", "assets");
			let jsUri: vscode.Uri | undefined;
			let cssUri: vscode.Uri | undefined;
			let assetsFileName = fs.readdirSync(assetsUri.fsPath);
			for (let index = 0; index < assetsFileName.length; index++) {
				const fileName = assetsFileName[index];
				if (fileName.endsWith(".js"))
					jsUri = vscode.Uri.joinPath(assetsUri, fileName);
				else if (fileName.endsWith(".css"))
					cssUri = vscode.Uri.joinPath(assetsUri, fileName);
			}
			if (!jsUri || !cssUri) {
				vscode.window.showWarningMessage('js/css assets not found');
				return;
			}

			this.panel = vscode.window.createWebviewPanel(
				'simple-word-count.wordCountAll',
				'statistics',
				vscode.ViewColumn.One,
				{ enableScripts: true, retainContextWhenHidden: true });
			this.panel.onDidDispose(() => this.panel = undefined);
			jsUri = this.panel.webview.asWebviewUri(jsUri);
			cssUri = this.panel.webview.asWebviewUri(cssUri);
			this.panel.webview.html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="stylesheet" href="${cssUri}">
</head>
<body><div id="app"></div></body>
<script src="${jsUri}"></script>
</html>`;

			const fileTree: Folder[] = []
			let filePathList: string[] = []
			for (let index = 0; index < folders.length; index++) {
				const folder = folders[index];
				const { fileTree: tree, filePathList: list } = getFilesAndDirectories(folder.uri.fsPath, this.activateFileExtensions);
				fileTree.push(tree)
				filePathList = filePathList.concat(list)
			}

			const list: { [key: string]: number } = {}
			let count = 0;
			for (let index = 0; index < filePathList.length; index++) {
				const path = filePathList[index];
				this.service.countTextFile(path, (n) => {
					count++;
					list[path] = Number(n);
					if (count === filePathList.length) {
						this.shouldSpin = false;
						this.updateStatusBarItem();
						if (this.panel)
							this.panel.webview.postMessage({ trees: fileTree, list: list });
					}
				});
			}
		} else
			vscode.window.showWarningMessage('not in workspace');
	}

	activateCurrent() {
		if (this.activedTextEditor) {
			if (this.activedTextEditor.document.isUntitled)
				vscode.window.showWarningMessage('not regular file');
			else {
				this.activateFiles.push(this.activedTextEditor.document.uri.fsPath);
				this.updateTotalCount();
			}
		} else {
			vscode.window.showWarningMessage('no active text editor');
		}
	}

	activateAlways() {
		this.alwaysActive = true;
		this.updateTotalCount();
	}

	dispose() {
		this.service.dispose();
		this.statusBarItem.dispose();
		if (this.panel)
			this.panel.dispose();
	}
}

interface File {
	name: string;
	path: string;
}

interface Folder {
	name: string;
	folders: Folder[];
	files: File[];
}

function getFilesAndDirectories(dir: string, fileExtensions: string[]): { fileTree: Folder, filePathList: string[] } {
	const fileTree: Folder = { name: path.basename(dir), folders: [], files: [] };
	let filePathList: string[] = []

	const files = fs.readdirSync(dir);
	for (let index = 0; index < files.length; index++) {
		const file = files[index];
		const filePath = path.join(dir, file);
		const fileStat = fs.statSync(filePath);
		if (fileStat.isDirectory()) {
			let { fileTree: tree, filePathList: list } = getFilesAndDirectories(filePath, fileExtensions);
			if (list.length > 0) {
				fileTree.folders.push(tree);
				filePathList = filePathList.concat(list);
			}
		} else {
			const ext = path.extname(file).toLocaleLowerCase();
			if (fileExtensions.includes(ext)) {
				fileTree.files.push({ name: file, path: filePath });
				filePathList.push(filePath);
			}
		}
	}

	return { fileTree: fileTree, filePathList: filePathList };
}

function createSevice(extensionUri: vscode.Uri): Promise<Service> {
	const platform = process.platform;
	const arch = process.arch;
	let binName = "simple-word-count";
	if (process.platform === 'win32')
		binName += '.exe';
	let servicePath = vscode.Uri.joinPath(extensionUri, 'bin', platform, arch, binName);

	if (!fs.existsSync(servicePath.fsPath))
		return Promise.reject('service not found: ' + servicePath.fsPath + `. ${platform}-${arch} is not supported.`);

	return new Promise<Service>((resolve, reject) => {
		const child = child_process.spawn(servicePath.fsPath)
			.once('error', (error) => reject(error));
		readline.createInterface({ input: child.stdout })
			.once('line', (port) => {
				const socket: net.Socket = net.createConnection(Number(port), "127.0.0.1");
				socket.once('connect', () => resolve(new Service(child, socket)));
				socket.once('error', (error) => reject(error));
				socket.once('timeout', () => reject('connect to service timeout'));
			})
	})
}

class Service {
	private childProcess: child_process.ChildProcess;
	private socket: net.Socket;
	private sessionCallback: { [key: string]: (n: string) => void } = {};
	private sessionId: number = 0;

	constructor(childProcess: child_process.ChildProcess, socket: net.Socket) {
		this.childProcess = childProcess;
		this.socket = socket;

		childProcess.on('error', (error) => console.error(error));
		childProcess.on('exit', () => console.error('child process exit'));

		socket.on('error', (error) => console.error(error));
		socket.on('close', () => console.error('socket close'));
		socket.on('end', () => console.error('socket end'));
		socket.on('timeout', () => console.error('socket timeout'));

		readline.createInterface({ input: socket })
			.on('line', (line) => {
				const cmd = line.split(';');
				if (cmd.length === 2) {
					const sessionId = cmd[0];
					const n = cmd[1];
					if (this.sessionCallback[sessionId]) {
						this.sessionCallback[sessionId](n);
						delete this.sessionCallback[sessionId];
					}
				}
			});
	}

	private getSessionId() {
		if (this.sessionId === 0xFFFFFFFF)
			this.sessionId = 0;
		else
			this.sessionId++;
		return this.sessionId;
	}

	countTextStr(str: string, cb: (n: string) => void) {
		const strBuffer = Buffer.from(str);
		const sessionId = this.getSessionId().toString();
		const cmd = `txt;str;${sessionId};${strBuffer.length}\n`
		this.sessionCallback[sessionId] = cb;
		this.socket.write(cmd);
		this.socket.write(strBuffer);
	}

	countTextFile(filePath: string, cb: (n: string) => void) {
		const strBuffer = Buffer.from(filePath);
		const sessionId = this.getSessionId().toString();
		const cmd = `txt;file;${sessionId};${strBuffer.length}\n`
		this.sessionCallback[sessionId] = cb;
		this.socket.write(cmd);
		this.socket.write(strBuffer);
	}

	dispose() {
		this.socket.write('\n');
		this.socket.destroy();
		this.childProcess.kill();
	}
}