'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const vscode = require("vscode");
class Logger {
    constructor(filename) {
        if (Logger.outputChannel == null) {
            Logger.outputChannel = vscode.window.createOutputChannel('CodeSync');
        }
        this.filename = filename;
    }
    appendLine(value) {
        let output = '';
        if (Logger.lastCalledFilename == null) {
            Logger.lastCalledFilename = this.filename;
            output += `${this.filename}.ts\n`;
        }
        if (Logger.lastCalledFilename != this.filename) {
            output += `${this.filename}.ts\n`;
            Logger.lastCalledFilename = this.filename;
        }
        output += `\t${new Date().toISOString()} - ${value}`;
        Logger.outputChannel.appendLine(output);
    }
}
exports.Logger = Logger;
Logger.outputChannel = null;
Logger.lastCalledFilename = null;
//# sourceMappingURL=logger.js.map