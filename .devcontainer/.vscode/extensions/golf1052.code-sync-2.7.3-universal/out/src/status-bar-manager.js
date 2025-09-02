'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarManager = void 0;
const vscode = require("vscode");
class StatusBarManager {
    constructor() {
        this.package = '$(package)';
        this.check = '$(check)';
        this.alert = '$(alert)';
        this.stop = '$(stop)';
        this.sync = '$(sync)';
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
        this.statusBarText = '';
        this.icons = [];
        this.setCheck();
        this.visible = false;
    }
    get StatusBarText() {
        return this.statusBarText;
    }
    set StatusBarText(text) {
        this.statusBarText = text;
        this.build();
    }
    show() {
        this.statusBar.show();
        this.visible = true;
    }
    hide() {
        this.statusBar.hide();
        this.visible = false;
    }
    toggle() {
        if (this.visible) {
            this.hide();
        }
        else {
            this.show();
        }
        return this.visible;
    }
    reset() {
        this.StatusBarText = '';
        this.setCheck();
    }
    setCheck() {
        this.resetIcons();
        this.icons.push(this.check);
        this.build();
    }
    setAlert() {
        this.resetIcons();
        this.icons.push(this.alert);
        this.build();
    }
    setStop() {
        this.resetIcons();
        this.icons.push(this.stop);
        this.build();
    }
    setSync() {
        this.resetIcons();
        this.icons.push(this.sync);
        this.build();
    }
    build() {
        let text = '';
        this.icons.forEach(i => {
            text += i + ' ';
        });
        text += 'CodeSync';
        if (this.statusBarText != '') {
            text += ': ' + this.statusBarText;
        }
        this.statusBar.text = text;
    }
    resetIcons() {
        this.icons = [this.package];
    }
}
exports.StatusBarManager = StatusBarManager;
//# sourceMappingURL=status-bar-manager.js.map