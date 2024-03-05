import * as vscode from 'vscode';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as net from 'net';
import * as readline from 'readline';

export function activate(context: vscode.ExtensionContext) {
	const service = new Service(context.extensionPath);

	let countCommand = vscode.commands.registerCommand('simple-word-count.count', () => {
		service.countPlaintextStr('hello world', (n) => { console.log(n); });
	});
	let activateCommand = vscode.commands.registerCommand('simple-word-count.activate', () => {
		service.countPlaintextFile("D:\\book\\第2章 修炼功法、血咒炼体.txt", (n) => { console.log(n); });
	})
	let activateAllCommand = vscode.commands.registerCommand('simple-word-count.activateAll', () => {
	})

	context.subscriptions.push(service);
	context.subscriptions.push(countCommand);
	context.subscriptions.push(activateCommand);
	context.subscriptions.push(activateAllCommand);
	service.initialize();
}

export function deactivate() { }


class Service {
	private socket: net.Socket | undefined;
	private childProcess: child_process.ChildProcess | undefined;
	private servicePath: string;
	private sessionCallback: { [key: string]: (n: string) => void } = {};
	private initializing: boolean = false;
	private sessionId: number = 0;

	constructor(extensionPath: string) {
		if (process.platform === 'win32')
			this.servicePath = extensionPath + '/assets/simple-word-count.exe';
		else
			this.servicePath = extensionPath + '/assets/simple-word-count';
	}

	initialize() {
		if (this.childProcess && this.socket) return
		if (fs.existsSync(this.servicePath)) {
			if (this.initializing) return;
			this.initializing = true;
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "simple-word-count",
				cancellable: false
			}, (progress, token) => {
				return new Promise<string | undefined>((resolve, reject) => {
					progress.report({ message: "start service process..." });
					const child = child_process.spawn(this.servicePath)
						.on('error', (error) => resolve(error.message));
					readline.createInterface({ input: child.stdout })
						.on('line', (line) => {
							progress.report({ message: `connect to service 127.0.0.1:${line}` });
							const socket = net.createConnection(Number(line), "127.0.0.1", () => resolve(undefined));
							readline.createInterface({ input: socket }).on('line', (line) => {
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
							this.socket = socket;
						})
					this.childProcess = child;
				})
			}).then((result) => {
				if (result) vscode.window.showErrorMessage(result);
				this.initializing = false;
			})
		} else {
			vscode.window.showErrorMessage(`service not found: ${this.servicePath}`);
		}
	}

	getSessionId() {
		if (this.sessionId === 0xFFFFFFFF)
			this.sessionId = 0;
		else
			this.sessionId++;
		return this.sessionId;
	}

	countPlaintextStr(str: string, cb: (n: string) => void) {
		if (this.socket) {
			const strBuffer = Buffer.from(str);
			const sessionId = this.getSessionId().toString();
			const cmd = `txt;str;${sessionId};${strBuffer.length}\n`
			this.sessionCallback[sessionId] = cb;
			this.socket.write(cmd);
			this.socket.write(strBuffer);
		}
	}

	countPlaintextFile(filePath: string, cb: (n: string) => void) {
		if (this.socket) {
			const strBuffer = Buffer.from(filePath);
			const sessionId = this.getSessionId().toString();
			const cmd = `txt;file;${sessionId};${strBuffer.length}\n`
			this.sessionCallback[sessionId] = cb;
			this.socket.write(cmd);
			this.socket.write(strBuffer);
		}
	}

	dispose() {
		if (this.socket) {
			this.socket.write('\n');
			this.socket.destroy();
			this.socket = undefined;
		}
		if (this.childProcess) {
			this.childProcess.kill();
			this.childProcess = undefined;
		}
	}
}