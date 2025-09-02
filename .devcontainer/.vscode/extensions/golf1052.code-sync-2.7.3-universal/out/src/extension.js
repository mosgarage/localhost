'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const cs = require("./cs");
const helpers = require("./helpers");
const logger_1 = require("./logger");
var logger;
var codeSync;
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        logger = new logger_1.Logger('extension');
        codeSync = new cs.CodeSync(cs.vsCodeExtensionDir, cs.codeSyncExtensionDir, '');
        // we need to check for settings to ensure they exist because we start using them right away
        yield codeSync.checkForSettings();
        helpers.isCodeASnapPackage(codeSync.Settings.Settings, true);
        codeSync.CanManageExtensions = helpers.isCodeOnPath(codeSync.Settings.Settings);
        if (!codeSync.CanManageExtensions) {
            yield vscode.window.showWarningMessage(helpers.getCodePathWarningMessage());
        }
        codeSync.Active = true;
        if (codeSync.Active) {
            codeSync.startFileWatcher();
            if (codeSync.Settings.Settings.autoImport) {
                codeSync.importSettings();
                yield codeSync.importKeybindings();
                yield codeSync.importSnippets();
                if (codeSync.CanManageExtensions) {
                    codeSync.importExtensions();
                    if (codeSync.Settings.Settings.autoExport) {
                        codeSync.exportExtensions();
                    }
                }
            }
            codeSync.setStatusBarIcon();
        }
        let importAllDisposable = vscode.commands.registerCommand('codeSync.importAll', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.importAll();
            });
        });
        let exportAllDisposable = vscode.commands.registerCommand('codeSync.exportAll', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.exportAll();
            });
        });
        let importSettingsDisposable = vscode.commands.registerCommand('codeSync.importSettings', function () {
            codeSync.importSettings();
        });
        let exportSettingsDisposable = vscode.commands.registerCommand('codeSync.exportSettings', function () {
            codeSync.exportSettings();
        });
        let importKeybindingsDisposable = vscode.commands.registerCommand('codeSync.importKeybindings', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.importKeybindings();
            });
        });
        let exportKeybindingsDisposable = vscode.commands.registerCommand('codeSync.exportKeybindings', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.exportKeybindings();
            });
        });
        let importSnippetsDisposable = vscode.commands.registerCommand('codeSync.importSnippets', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.importSnippets();
            });
        });
        let exportSnippetsDisposable = vscode.commands.registerCommand('codeSync.exportSnippets', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.exportSnippets();
            });
        });
        let importExtensionsDisposable = vscode.commands.registerCommand('codeSync.importExtensions', function () {
            if (codeSync.CanManageExtensions) {
                codeSync.importExtensions();
            }
            else {
                vscode.window.showWarningMessage(helpers.getCodePathWarningMessage());
            }
        });
        let exportExtensionsDisposable = vscode.commands.registerCommand('codeSync.exportExtensions', function () {
            if (codeSync.CanManageExtensions) {
                codeSync.exportExtensions();
            }
            else {
                vscode.window.showWarningMessage(helpers.getCodePathWarningMessage());
            }
        });
        let listExcludedInstalledDisposable = vscode.commands.registerCommand('codeSync.listExcludedInstalled', function () {
            codeSync.displayExcludedInstalledPackages();
        });
        let listExcludedExternalDisposable = vscode.commands.registerCommand('codeSync.listExcludedExternal', function () {
            codeSync.displayExcludedExternalPackages();
        });
        let addExcludedInstalledDisposable = vscode.commands.registerCommand('codeSync.addExcludedInstalled', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.addExcludedInstalledPackage();
            });
        });
        let addExcludedExternalDisposable = vscode.commands.registerCommand('codeSync.addExcludedExternal', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.addExcludedExternalPackage();
            });
        });
        let removeExcludedInstalledDisposable = vscode.commands.registerCommand('codeSync.removeExcludedInstalled', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.removeExcludedInstalledPackage();
            });
        });
        let removeExcludedExternalDisposable = vscode.commands.registerCommand('codeSync.removeExcludedExternal', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.removeExcludedExternalPackage();
            });
        });
        let toggleAutoImportDisposable = vscode.commands.registerCommand('codeSync.toggleAutoImport', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.toggleSetting('autoImport', codeSync.Settings.Settings.autoImport);
            });
        });
        let toggleAutoExportDisposable = vscode.commands.registerCommand('codeSync.toggleAutoExport', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.toggleSetting('autoExport', codeSync.Settings.Settings.autoExport);
            });
        });
        let toggleImportSettingsDisposable = vscode.commands.registerCommand('codeSync.toggleImportSettings', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.toggleSetting('importSettings', codeSync.Settings.Settings.importSettings);
            });
        });
        let toggleImportKeybindingsDisposable = vscode.commands.registerCommand('codeSync.toggleImportKeybindings', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.toggleSetting('importKeybindings', codeSync.Settings.Settings.importKeybindings);
            });
        });
        let toggleImportSnippetsDisposable = vscode.commands.registerCommand('codeSync.toggleImportSnippets', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.toggleSetting('importSnippets', codeSync.Settings.Settings.importSnippets);
            });
        });
        let toggleImportExtensionsDisposable = vscode.commands.registerCommand('codeSync.toggleImportExtensions', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.toggleSetting('importExtensions', codeSync.Settings.Settings.importExtensions);
            });
        });
        let setSyncPathDisposable = vscode.commands.registerCommand('codeSync.setSyncPath', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.setExternalSyncPath();
            });
        });
        let toggleStatusBarDisposable = vscode.commands.registerCommand('codeSync.toggleStatusBar', function () {
            codeSync.toggleStatusBarIcon();
        });
        const setCodeExecutableName = vscode.commands.registerCommand('codeSync.setCodeExecutableName', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.setCodeExecutableName();
            });
        });
        const setCodeSettingsPath = vscode.commands.registerCommand('codeSync.setCodeSettingsPath', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield codeSync.setCodeSettingsPath();
            });
        });
        context.subscriptions.push(importAllDisposable, exportAllDisposable, importSettingsDisposable, exportSettingsDisposable, importKeybindingsDisposable, exportKeybindingsDisposable, importSnippetsDisposable, exportSnippetsDisposable, importExtensionsDisposable, exportExtensionsDisposable, listExcludedInstalledDisposable, listExcludedExternalDisposable, addExcludedInstalledDisposable, addExcludedExternalDisposable, removeExcludedInstalledDisposable, removeExcludedExternalDisposable, toggleAutoImportDisposable, toggleAutoExportDisposable, toggleImportSettingsDisposable, toggleImportKeybindingsDisposable, toggleImportSnippetsDisposable, toggleImportExtensionsDisposable, setSyncPathDisposable, toggleStatusBarDisposable, setCodeExecutableName, setCodeSettingsPath);
    });
}
exports.activate = activate;
function deactivate() {
    if (codeSync.CanManageExtensions) {
        if (codeSync.Settings.Settings.autoExport) {
            codeSync.exportExtensions();
        }
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map