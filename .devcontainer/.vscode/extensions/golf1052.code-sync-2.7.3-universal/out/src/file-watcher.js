'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileWatcher = void 0;
const chokidar = require("chokidar");
const helpers = require("./helpers");
const logger_1 = require("./logger");
class FileWatcher {
    constructor(files, codeSyncSettings) {
        this.change = (path, stats) => {
            if (this.codeSyncSettings.Settings.autoExport) {
                this.logger.appendLine(`Detected file change at ${path}, syncing...`);
                if (this.files[path]) {
                    this.files[path]();
                }
                else if (path.includes(helpers.getSnippetsFolderPath(this.codeSyncSettings.Settings))) {
                    this.files[helpers.getSnippetsFolderPath(this.codeSyncSettings.Settings)]();
                }
            }
        };
        this.logger = new logger_1.Logger('file-watcher');
        this.watchers = [];
        this.files = files;
        this.codeSyncSettings = codeSyncSettings;
        let paths = Object.keys(files);
        paths.forEach(path => {
            let watcher = chokidar.watch(path, {
                awaitWriteFinish: {
                    stabilityThreshold: 2000,
                    pollInterval: 100
                }
            });
            watcher.on('change', (path, stats) => {
                this.change(path, stats);
            });
            this.watchers.push(watcher);
        });
    }
}
exports.FileWatcher = FileWatcher;
//# sourceMappingURL=file-watcher.js.map