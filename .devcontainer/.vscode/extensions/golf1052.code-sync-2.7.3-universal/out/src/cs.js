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
exports.CodeSync = exports.codeSyncExtensionDir = exports.vsCodeExtensionDir = exports.currentVersion = exports.LOCAL_SETTINGS = exports.SNIPPETS = exports.KEYBINDINGS = exports.SETTINGS = exports.EXTENSIONS = void 0;
const vscode = require("vscode");
const os = require("os");
const path = require("path");
const status_bar_manager_1 = require("./status-bar-manager");
const settings = require("./settings");
const helpers = require("./helpers");
const fs = require("fs");
var rimraf = require('rimraf');
const file_watcher_1 = require("./file-watcher");
const local_settings_1 = require("./local-settings");
const logger_1 = require("./logger");
exports.EXTENSIONS = 'extensions.json';
exports.SETTINGS = 'settings.json';
exports.KEYBINDINGS = 'keybindings.json';
exports.SNIPPETS = 'snippets';
exports.LOCAL_SETTINGS = 'local-settings.json';
exports.currentVersion = '2.7.3';
exports.vsCodeExtensionDir = helpers.getExtensionDir();
exports.codeSyncExtensionDir = path.join(exports.vsCodeExtensionDir, 'golf1052.code-sync-' + exports.currentVersion);
class CodeSync {
    constructor(vsCodeExtensionDir, codeSyncExtensionDir, codeSyncDir) {
        this.startFileWatcher = () => {
            let files = {};
            if (fs.existsSync(helpers.getUserSettingsFilePath(this.Settings.Settings))) {
                files[helpers.getUserSettingsFilePath(this.Settings.Settings)] = this.exportSettings.bind(this);
            }
            if (fs.existsSync(helpers.getKeybindingsFilePath(this.Settings.Settings))) {
                files[helpers.getKeybindingsFilePath(this.Settings.Settings)] = this.exportKeybindings.bind(this);
            }
            if (fs.existsSync(helpers.getSnippetsFolderPath(this.Settings.Settings))) {
                files[helpers.getSnippetsFolderPath(this.Settings.Settings)] = this.exportSnippets.bind(this);
            }
            this.fileWatcher = new file_watcher_1.FileWatcher(files, this.Settings);
        };
        this.logger = new logger_1.Logger('cs');
        this.vsCodeExtensionDir = vsCodeExtensionDir;
        this.codeSyncExtensionDir = codeSyncExtensionDir;
        this.codeSyncDir = codeSyncDir;
        this.statusBar = new status_bar_manager_1.StatusBarManager();
        this.codeSyncSettings = new settings.CodeSyncSettings(path.join(this.codeSyncExtensionDir, exports.SETTINGS), path.join(this.codeSyncDir, exports.EXTENSIONS));
        this.active = false;
        this.localSettingsManager = new local_settings_1.LocalSettings(this.codeSyncExtensionDir);
    }
    get Active() {
        return this.active;
    }
    set Active(active) {
        if (active) {
            this.statusBar.show();
        }
        else {
            this.statusBar.hide();
        }
        this.active = active;
    }
    get Settings() {
        return this.codeSyncSettings;
    }
    get CanManageExtensions() {
        return this.canManageExtensions;
    }
    set CanManageExtensions(canManageExtensions) {
        this.canManageExtensions = canManageExtensions;
    }
    toggleStatusBarIcon() {
        let settings = this.Settings.Settings;
        let visible = this.statusBar.toggle();
        settings.showStatusBarIcon = visible;
        this.Settings.Settings = settings;
        this.Settings.save();
    }
    setStatusBarIcon() {
        let settings = this.Settings.Settings;
        if (!settings.showStatusBarIcon) {
            this.statusBar.hide();
        }
    }
    checkForSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.appendLine('Checking settings');
            this.statusBar.StatusBarText = 'Checking settings';
            this.checkForOldSettings();
            yield this.migrateSettings();
            let extensionDir = helpers.getDir(this.codeSyncExtensionDir);
            // if settings don't already exist
            if (!fs.existsSync(path.join(extensionDir, exports.SETTINGS))) {
                this.logger.appendLine(`Could not find settings in ${path.join(extensionDir, exports.SETTINGS)}. Creating...`);
                // we need to create settings on first launch because when we call this.Settings.Settings
                // we're going to try to read settings that don't exist yet
                let tmpSettings = {
                    $schema: './schema/settings.schema.json',
                    externalPath: path.join(os.homedir(), 'OneDrive/Apps/code-sync'),
                    autoImport: true,
                    autoExport: true,
                    importSettings: true,
                    importKeybindings: true,
                    importSnippets: true,
                    importExtensions: true,
                    showStatusBarIcon: true,
                    excluded: {
                        installed: [],
                        external: []
                    },
                    executableName: '',
                    settingsPath: ''
                };
                this.Settings.Settings = tmpSettings;
                this.Settings.save();
                yield this.setExternalSyncPath();
            }
            let csSettings = this.Settings.Settings;
            this.codeSyncDir = csSettings.externalPath;
            let externalExtensionsPath = path.join(this.codeSyncDir, exports.EXTENSIONS);
            this.logger.appendLine(`Setting external extensions path as ${externalExtensionsPath}.`);
            this.Settings.ExternalExtensionsPath = externalExtensionsPath;
            if (!fs.existsSync(this.codeSyncDir)) {
                this.logger.appendLine(`CodeSync external sync directory isn't there?`);
                this.logger.appendLine(`Creating external sync path directory: ${this.codeSyncDir}.`);
                helpers.getDir(this.codeSyncDir);
            }
            this.statusBar.reset();
            this.logger.appendLine('Done checking settings.');
            this.logger.appendLine(`External sync directory: ${csSettings.externalPath}`);
        });
    }
    setExternalSyncPath() {
        return __awaiter(this, void 0, void 0, function* () {
            let extPath = '';
            extPath = yield vscode.window.showInputBox({
                prompt: 'Enter the full path to where you want CodeSync to sync to',
                value: path.join(os.homedir(), 'OneDrive/Apps/code-sync')
            });
            if (extPath == undefined) {
                return;
            }
            else if (extPath == '') {
                yield vscode.window.showWarningMessage('External sync path was blank');
                return;
            }
            if (!fs.existsSync(extPath)) {
                this.logger.appendLine(`Creating external sync path: ${extPath}`);
                helpers.getDir(extPath);
            }
            let csSettings = this.Settings.Settings;
            csSettings.externalPath = extPath;
            this.codeSyncDir = extPath;
            this.Settings.Settings = csSettings;
            this.Settings.save();
            this.logger.appendLine(`External sync path is now ${this.Settings.Settings.externalPath}.`);
        });
    }
    importAll() {
        return __awaiter(this, void 0, void 0, function* () {
            this.startSync('Importing all');
            this.importSettings();
            yield this.importKeybindings();
            yield this.importSnippets();
            if (this.CanManageExtensions) {
                this.importExtensions();
            }
            this.statusBar.reset();
        });
    }
    exportAll() {
        return __awaiter(this, void 0, void 0, function* () {
            this.startSync('Exporting all');
            this.exportSettings();
            yield this.exportKeybindings();
            yield this.exportSnippets();
            if (this.CanManageExtensions) {
                this.exportExtensions();
            }
            this.statusBar.reset();
        });
    }
    importSettings() {
        if (this.Settings.Settings.importSettings) {
            this.logger.appendLine('Importing settings');
            this.startSync('Importing settings');
            let settingsPath = path.join(this.codeSyncDir, exports.SETTINGS);
            if (!fs.existsSync(settingsPath)) {
                this.logger.appendLine(`Failed to import settings. Could not find settings.json at ${settingsPath}. Giving up.`);
                this.statusBar.reset();
                return;
            }
            if (helpers.isFileEmpty(settingsPath) == false &&
                helpers.isFileContentEmpty(settingsPath) == false) {
                const userSettingsFilePath = helpers.getUserSettingsFilePath(this.Settings.Settings);
                this.logger.appendLine(`Importing settings to ${userSettingsFilePath}`);
                this.localSettingsManager.import(settingsPath, userSettingsFilePath);
            }
            this.statusBar.reset();
            this.logger.appendLine('Finished importing settings.');
        }
    }
    exportSettings() {
        if (this.Settings.Settings.importSettings) {
            this.logger.appendLine('Exporting settings.');
            this.startSync('Exporting settings');
            let settingsPath = helpers.getUserSettingsFilePath(this.Settings.Settings);
            if (!fs.existsSync(settingsPath)) {
                this.logger.appendLine(`Could not find settings path at ${settingsPath}. Giving up.`);
                this.statusBar.reset();
                return;
            }
            this.localSettingsManager.export(settingsPath, path.join(this.codeSyncDir, exports.SETTINGS));
            this.statusBar.reset();
            this.logger.appendLine('Finished exporting settings.');
        }
    }
    importKeybindings() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.Settings.Settings.importKeybindings) {
                this.logger.appendLine('Importing keybindings');
                this.startSync('Importing keybindings');
                let keybindingsPath = path.join(this.codeSyncDir, exports.KEYBINDINGS);
                if (!fs.existsSync(keybindingsPath)) {
                    this.logger.appendLine(`Failed to import keybindings. Could not find keybindings.json at ${keybindingsPath}. Giving up.`);
                    this.statusBar.reset();
                    return;
                }
                if (helpers.isFileEmpty(keybindingsPath) == false &&
                    helpers.isFileContentEmpty(keybindingsPath) == false) {
                    const keybindingsFilePath = helpers.getKeybindingsFilePath(this.Settings.Settings);
                    this.logger.appendLine(`Importing keybindings to ${keybindingsFilePath}`);
                    yield helpers.copy(keybindingsPath, keybindingsFilePath);
                }
                this.statusBar.reset();
                this.logger.appendLine('Finished importing keybindings.');
            }
        });
    }
    exportKeybindings() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.Settings.Settings.importKeybindings) {
                this.startSync('Exporting keybindings');
                let keybindingsPath = helpers.getKeybindingsFilePath(this.Settings.Settings);
                if (!fs.existsSync(keybindingsPath)) {
                    this.logger.appendLine(`Could not find keybindings path at ${keybindingsPath}. Giving up.`);
                    this.statusBar.reset();
                    return;
                }
                yield helpers.copy(keybindingsPath, path.join(this.codeSyncDir, exports.KEYBINDINGS));
                this.statusBar.reset();
            }
        });
    }
    importSnippets() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.Settings.Settings.importSnippets) {
                this.logger.appendLine('Importing snippets');
                this.startSync('Importing snippets');
                let snippetsDirectory = path.join(this.codeSyncDir, exports.SNIPPETS);
                if (!fs.existsSync(snippetsDirectory)) {
                    this.logger.appendLine(`Failed to import snippets. Could not find snippets directory at ${snippetsDirectory}. Giving up.`);
                    this.statusBar.reset();
                    return;
                }
                let snippetFiles = fs.readdirSync(snippetsDirectory);
                for (let i = 0; i < snippetFiles.length; i++) {
                    let s = snippetFiles[i];
                    if (fs.lstatSync(path.join(snippetsDirectory, s)).isFile()) {
                        if (helpers.isFileEmpty(path.join(snippetsDirectory, s)) == false &&
                            helpers.isFileContentEmpty(path.join(snippetsDirectory, s)) == false) {
                            yield helpers.copy(path.join(snippetsDirectory, s), path.join(helpers.getSnippetsFolderPath(this.Settings.Settings), s));
                        }
                    }
                }
                this.statusBar.reset();
                this.logger.appendLine('Finished importing snippets.');
            }
        });
    }
    exportSnippets() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.Settings.Settings.importSnippets) {
                this.startSync('Exporting snippets');
                const snippetsFolderPath = helpers.getSnippetsFolderPath(this.Settings.Settings);
                if (!fs.existsSync(snippetsFolderPath)) {
                    this.logger.appendLine(`Could not find snippets path at ${snippetsFolderPath}. Giving up.`);
                    this.statusBar.reset();
                    return;
                }
                yield helpers.copy(snippetsFolderPath, path.join(this.codeSyncDir, exports.SNIPPETS));
                this.statusBar.reset();
            }
        });
    }
    importExtensions() {
        if (this.Settings.Settings.importExtensions) {
            this.logger.appendLine('Importing extensions');
            this.startSync('Importing extensions');
            let excluded = this.Settings.ExcludedExternalPackages;
            let extensions = this.Settings.Extensions;
            let installedExtensions = helpers.getInstalledExtensions();
            let installedAny = false;
            extensions.forEach(e => {
                if (installedExtensions.filter(i => i.id == e).length == 0) {
                    let val = helpers.installExtension(e, this.Settings.Settings);
                    if (val) {
                        installedAny = true;
                    }
                }
            });
            if (installedAny) {
                this.statusBar.StatusBarText = 'Restart required';
                this.statusBar.setStop();
            }
            else {
                this.statusBar.reset();
            }
            this.logger.appendLine('Finished importing extensions.');
        }
    }
    exportExtensions() {
        if (this.Settings.Settings.importExtensions) {
            this.logger.appendLine('Exporting extensions');
            this.startSync('Exporting extensions');
            let excluded = this.Settings.ExcludedInstalledPackages;
            let extensions = [];
            let e = helpers.getInstalledExtensions();
            helpers.getInstalledExtensions().forEach(e => {
                if (excluded.indexOf(e.id) == -1) {
                    extensions.push(e.id);
                }
            });
            this.Settings.Extensions = extensions;
            this.Settings.saveExtensions();
            this.statusBar.reset();
            this.logger.appendLine('Finished exporting extensions');
        }
    }
    addExcludedInstalledPackage() {
        return __awaiter(this, void 0, void 0, function* () {
            let excluded = this.Settings.Settings.excluded.installed;
            let items = [];
            let installed = helpers.getInstalledExtensions();
            if (installed.length == 0) {
                vscode.window.showInformationMessage('There are no installed extensions.');
                return;
            }
            installed.forEach(e => {
                if (excluded.indexOf(e.id) == -1) {
                    items.push({
                        label: e.id,
                        description: e.packageJSON.description
                    });
                }
            });
            if (items.length == 0) {
                vscode.window.showInformationMessage('All installed extensions excluded.');
                return;
            }
            let result = yield vscode.window.showQuickPick(items, { matchOnDescription: true });
            if (result) {
                excluded.push(result.label);
                let settings = this.Settings.Settings;
                settings.excluded.installed = excluded;
                this.Settings.Settings = settings;
                this.Settings.save();
                vscode.window.showInformationMessage('Successfully excluded package ' + result.label);
            }
        });
    }
    removeExcludedInstalledPackage() {
        return __awaiter(this, void 0, void 0, function* () {
            let excluded = this.Settings.Settings.excluded.installed;
            let items = [];
            excluded.forEach(str => {
                items.push({
                    label: str,
                    description: ''
                });
            });
            if (items.length == 0) {
                vscode.window.showInformationMessage('No installed extensions excluded.');
                return;
            }
            let result = yield vscode.window.showQuickPick(items);
            if (result) {
                excluded.splice(excluded.indexOf(result.label, 1));
                let settings = this.Settings.Settings;
                settings.excluded.installed = excluded;
                this.Settings.Settings = settings;
                this.Settings.save();
                vscode.window.showInformationMessage('Successfully included package ' + result.label);
            }
        });
    }
    addExcludedExternalPackage() {
        return __awaiter(this, void 0, void 0, function* () {
            let excluded = this.Settings.Settings.excluded.external;
            let external = this.Settings.Extensions;
            let items = [];
            if (external.length == 0) {
                vscode.window.showInformationMessage('There are no external extensions.');
                return;
            }
            external.forEach(e => {
                if (excluded.indexOf(e) == -1) {
                    items.push({
                        label: e,
                        description: ''
                    });
                }
            });
            if (items.length == 0) {
                vscode.window.showInformationMessage('All external extensions excluded.');
                return;
            }
            let result = yield vscode.window.showQuickPick(items);
            if (result) {
                excluded.push(result.label);
                let settings = this.Settings.Settings;
                settings.excluded.external = excluded;
                this.Settings.Settings = settings;
                this.Settings.save();
                vscode.window.showInformationMessage('Successfully excluded package ' + result.label);
            }
        });
    }
    removeExcludedExternalPackage() {
        return __awaiter(this, void 0, void 0, function* () {
            let excluded = this.Settings.Settings.excluded.external;
            let items = [];
            excluded.forEach(str => {
                items.push({
                    label: str,
                    description: ''
                });
            });
            if (items.length == 0) {
                vscode.window.showInformationMessage('No external extensions excluded.');
                return;
            }
            let result = yield vscode.window.showQuickPick(items);
            if (result) {
                excluded.splice(excluded.indexOf(result.label, 1));
                let settings = this.Settings.Settings;
                settings.excluded.external = excluded;
                this.Settings.Settings = settings;
                this.Settings.save();
                vscode.window.showInformationMessage('Successfully included package ' + result.label);
            }
        });
    }
    displayExcludedInstalledPackages() {
        let excluded = this.Settings.Settings.excluded.installed;
        if (excluded.length == 0) {
            vscode.window.showInformationMessage('No excluded installed packages.');
            return;
        }
        vscode.window.showInformationMessage('Excluded installed packages:');
        excluded.forEach(e => {
            vscode.window.showInformationMessage(e);
        });
    }
    displayExcludedExternalPackages() {
        let excluded = this.Settings.Settings.excluded.external;
        if (excluded.length == 0) {
            vscode.window.showInformationMessage('No excluded external packages.');
            return;
        }
        vscode.window.showInformationMessage('Excluded external packages:');
        excluded.forEach(e => {
            vscode.window.showInformationMessage(e);
        });
    }
    toggleSetting(setting, value) {
        return __awaiter(this, void 0, void 0, function* () {
            let items = [];
            items.push({ label: 'On', description: '' });
            items.push({ label: 'Off', description: '' });
            let options = {};
            if (value) {
                items[0].description = 'Current setting';
            }
            else {
                items[1].description = 'Current setting';
            }
            let settings = this.Settings.Settings;
            let result = yield vscode.window.showQuickPick(items, options);
            if (result) {
                if (result.label == 'On') {
                    settings[setting] = true;
                }
                else {
                    settings[setting] = false;
                    if (setting == 'importSettings') {
                        if (fs.existsSync(path.join(this.Settings.Settings.externalPath, exports.SETTINGS))) {
                            rimraf.sync(path.join(this.Settings.Settings.externalPath, exports.SETTINGS));
                        }
                    }
                    else if (setting == 'importKeybindings') {
                        if (fs.existsSync(path.join(this.Settings.Settings.externalPath, exports.KEYBINDINGS))) {
                            rimraf.sync(path.join(this.Settings.Settings.externalPath, exports.KEYBINDINGS));
                        }
                    }
                    else if (setting == 'importSnippets') {
                        if (fs.existsSync(path.join(this.Settings.Settings.externalPath, exports.SNIPPETS))) {
                            rimraf.sync(path.join(this.Settings.Settings.externalPath, exports.SNIPPETS));
                        }
                    }
                    else if (setting == 'importExtensions') {
                        if (fs.existsSync(path.join(this.Settings.Settings.externalPath, exports.EXTENSIONS))) {
                            rimraf.sync(path.join(this.Settings.Settings.externalPath, exports.EXTENSIONS));
                        }
                    }
                }
                this.Settings.Settings = settings;
                this.Settings.save();
            }
        });
    }
    setCodeExecutableName() {
        return __awaiter(this, void 0, void 0, function* () {
            let executableName = '';
            executableName = yield vscode.window.showInputBox({
                prompt: 'Enter the VSCode executable name. NOTE: Do not include the file extension (.exe, .sh, etc.)',
                placeHolder: 'code'
            });
            if (executableName == undefined) {
                return;
            }
            else {
                vscode.window.showInformationMessage('Testing user defined VSCode executable name...');
                let oldExecutableName;
                if (this.Settings.Settings.executableName) {
                    oldExecutableName = this.Settings.Settings.executableName;
                }
                else {
                    oldExecutableName = '';
                }
                let csSettings = this.Settings.Settings;
                csSettings.executableName = executableName;
                this.Settings.Settings = csSettings;
                this.Settings.save();
                if (helpers.isCodeOnPath(this.Settings.Settings)) {
                    vscode.window.showInformationMessage(`Test succeeded. Will now use ${executableName} as VSCode executable name.`);
                }
                else {
                    csSettings.executableName = oldExecutableName;
                    this.Settings.Settings = csSettings;
                    this.Settings.save();
                    vscode.window.showInformationMessage('Test failed. Reverting back to old VSCode executable name.');
                }
            }
        });
    }
    setCodeSettingsPath() {
        return __awaiter(this, void 0, void 0, function* () {
            let settingsPath = '';
            settingsPath = yield vscode.window.showInputBox({
                prompt: 'Enter the VSCode user settings path. This must be an absolute path.',
                placeHolder: helpers.getDefaultCodeSettingsFolderPath()
            });
            if (settingsPath == undefined) {
                return;
            }
            else {
                vscode.window.showInformationMessage('Testing user defined VSCode user settings path...');
                const oldSettingsPath = this.Settings.Settings.settingsPath;
                this.Settings.Settings.settingsPath = settingsPath;
                this.Settings.save();
                if (!settingsPath) {
                    settingsPath = helpers.getDefaultCodeSettingsFolderPath();
                }
                if (fs.existsSync(settingsPath)) {
                    vscode.window.showInformationMessage(`Test succeeded. Will now use ${settingsPath} as VSCode user settings path.`);
                }
                else {
                    this.Settings.Settings.settingsPath = oldSettingsPath;
                    this.Settings.save();
                    vscode.window.showInformationMessage('Test failed. Reverting back to old VSCode user settings path.');
                }
            }
        });
    }
    startSync(text) {
        this.statusBar.StatusBarText = text;
        this.statusBar.setSync();
    }
    checkForOldSettings() {
        let folders = fs.readdirSync(this.vsCodeExtensionDir);
        folders.forEach(f => {
            let tmpExtension = helpers.getFolderExtensionInfo(f);
            if (tmpExtension.id == 'golf1052.code-sync') {
                if (tmpExtension.version != '') {
                    let splitVersion = tmpExtension.version.split('.');
                    if (splitVersion.length > 0) {
                        let major = parseInt(splitVersion[0]);
                        if (!isNaN(major) && major < 2) {
                            this.logger.appendLine(`Found version less than 2. Removing: ${tmpExtension.version}.`);
                            this.emptySyncDir(path.join(this.vsCodeExtensionDir, f, exports.SETTINGS));
                            rimraf.sync(path.join(this.vsCodeExtensionDir, f));
                        }
                    }
                    else {
                        this.logger.appendLine(`Could not split version. Removing: ${tmpExtension.version}.`);
                        this.emptySyncDir(path.join(this.vsCodeExtensionDir, f, exports.SETTINGS));
                        rimraf.sync(path.join(this.vsCodeExtensionDir, f));
                    }
                }
                else {
                    this.logger.appendLine(`Could not determine version. Removing ${path.join(this.vsCodeExtensionDir, f)}.`);
                    this.emptySyncDir(path.join(this.vsCodeExtensionDir, f, exports.SETTINGS));
                    rimraf.sync(path.join(this.vsCodeExtensionDir, f));
                }
            }
        });
    }
    migrateSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            let folders = fs.readdirSync(this.vsCodeExtensionDir);
            for (let i = 0; i < folders.length; i++) {
                let f = folders[i];
                let tmpExtension = helpers.getFolderExtensionInfo(f);
                if (tmpExtension.id == 'golf1052.code-sync') {
                    if (tmpExtension.id == 'golf1052.code-sync' && helpers.isVersionGreaterThan(exports.currentVersion, tmpExtension.version) == 1) {
                        // When the extension is updated we migrate settings to the new extension folder before trying to create settings.
                        // So if the settings files already exist we've migrated them already and we don't need to migrate them again.
                        // We don't migrate them again so we don't overwrite any new changes in the new settings files.
                        let settingsExists = fs.existsSync(path.join(exports.codeSyncExtensionDir, exports.SETTINGS));
                        let localSettingsExists = fs.existsSync(path.join(exports.codeSyncExtensionDir, exports.LOCAL_SETTINGS));
                        if (!settingsExists || !localSettingsExists) {
                            this.logger.appendLine(`Migrating stuff. Previous version: ${tmpExtension.version}. Current version: ${exports.currentVersion}.`);
                        }
                        else {
                            this.logger.appendLine(`All settings files already exist. Not migrating. Previous version: ${tmpExtension.version}. Current version: ${exports.currentVersion}.`);
                        }
                        if (fs.existsSync(path.join(this.vsCodeExtensionDir, f, exports.SETTINGS)) && !settingsExists) {
                            this.logger.appendLine(`Migrating settings.`);
                            let oldSettings = path.join(this.vsCodeExtensionDir, f, exports.SETTINGS);
                            let newSettings = path.join(exports.codeSyncExtensionDir, exports.SETTINGS);
                            this.logger.appendLine(`Previous file: ${oldSettings}. New file: ${newSettings}.`);
                            yield helpers.copy(oldSettings, newSettings);
                        }
                        if (fs.existsSync(path.join(this.vsCodeExtensionDir, f, exports.LOCAL_SETTINGS)) && !localSettingsExists) {
                            this.logger.appendLine(`Migrating local settings.`);
                            let oldLocalSettings = path.join(this.vsCodeExtensionDir, f, exports.LOCAL_SETTINGS);
                            let newLocalSettings = path.join(exports.codeSyncExtensionDir, exports.LOCAL_SETTINGS);
                            this.logger.appendLine(`Previous file: ${oldLocalSettings}. New file: ${newLocalSettings}.`);
                            yield helpers.copy(oldLocalSettings, newLocalSettings);
                        }
                    }
                }
            }
        });
    }
    emptySyncDir(settingsFilePath) {
        let settings = null;
        if (fs.existsSync(settingsFilePath)) {
            settings = helpers.parseJson(fs.readFileSync(settingsFilePath, 'utf8'));
        }
        try {
            if (fs.existsSync(settings.externalPath)) {
                let stuff = fs.readdirSync(settings.externalPath);
                stuff.forEach(f => {
                    rimraf.sync(path.join(settings.externalPath, f));
                });
            }
        }
        catch (ex) {
            return;
        }
    }
}
exports.CodeSync = CodeSync;
//# sourceMappingURL=cs.js.map