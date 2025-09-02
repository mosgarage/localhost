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
exports.stringifyJson = exports.parseJson = exports.getCodePathWarningMessage = exports.isFileContentEmpty = exports.isFileEmpty = exports.isVersionGreaterThan = exports.getFolderExtensionInfo = exports.isCodeASnapPackage = exports.logError = exports.isCodeOnPath = exports.installExtension = exports.getDir = exports.copy = exports.getSnippetsFolderPath = exports.getKeybindingsFilePath = exports.getUserSettingsFilePath = exports.getDefaultCodeSettingsFolderPath = exports.getExtensionDir = exports.getInstalledExtensions = exports.isInsiders = void 0;
const vscode = require("vscode");
const os = require("os");
const path = require("path");
const fs = require("fs");
const child_process = require("child_process");
const process = require("process");
const cs = require("./cs");
const recursive_copy = require('recursive-copy');
const mkdirp = require("mkdirp");
const json = require("comment-json");
const logger_1 = require("./logger");
let logger = new logger_1.Logger('helpers');
let windows = process.platform == 'win32';
let osx = process.platform == 'darwin';
let linux = process.platform == 'linux';
function isInsiders() {
    // I have no idea if this works for non english :|
    return vscode.env.appName.toLowerCase().includes("insider");
}
exports.isInsiders = isInsiders;
function getInstalledExtensions() {
    return vscode.extensions.all.filter(e => {
        if (windows) {
            return !e.extensionPath.includes('app\\extensions');
        }
        else {
            return !e.extensionPath.includes('app/extension');
        }
    });
}
exports.getInstalledExtensions = getInstalledExtensions;
function getExtensionDir() {
    let extensions = getInstalledExtensions();
    if (extensions.length > 0) {
        let p = path.parse(extensions[0].extensionPath);
        return p.dir;
    }
    else {
        let extensionsPath = '.vscode/extensions';
        if (isInsiders()) {
            extensionsPath = '.vscode-insiders/extensions';
        }
        return path.join(os.homedir(), extensionsPath);
    }
}
exports.getExtensionDir = getExtensionDir;
function getCodeSettingsFolderPath(settings) {
    if (settings.settingsPath) {
        logger.appendLine(`Using user defined settings path: ${settings.settingsPath}`);
        return settings.settingsPath;
    }
    return getDefaultCodeSettingsFolderPath();
}
function getDefaultCodeSettingsFolderPath() {
    let codeString = 'Code';
    if (isInsiders()) {
        codeString = 'Code - Insiders';
    }
    if (windows) {
        return path.join(process.env.APPDATA, `${codeString}/User/`);
    }
    else if (osx) {
        return path.join(os.homedir(), `Library/Application Support/${codeString}/User/`);
    }
    else if (linux) {
        return path.join(os.homedir(), `.config/${codeString}/User/`);
    }
    else {
        logger.appendLine('Unknown OS type, retur');
        return '';
    }
}
exports.getDefaultCodeSettingsFolderPath = getDefaultCodeSettingsFolderPath;
function getUserSettingsFilePath(settings) {
    return path.join(getCodeSettingsFolderPath(settings), cs.SETTINGS);
}
exports.getUserSettingsFilePath = getUserSettingsFilePath;
function getKeybindingsFilePath(settings) {
    return path.join(getCodeSettingsFolderPath(settings), cs.KEYBINDINGS);
}
exports.getKeybindingsFilePath = getKeybindingsFilePath;
function getSnippetsFolderPath(settings) {
    return path.join(getCodeSettingsFolderPath(settings), cs.SNIPPETS + '/');
}
exports.getSnippetsFolderPath = getSnippetsFolderPath;
function copy(src, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        var options = {
            overwrite: true
        };
        yield recursive_copy(src, dest, options);
    });
}
exports.copy = copy;
function getDir(path) {
    mkdirp.sync(path);
    return path;
}
exports.getDir = getDir;
// returns false if the extension was already installed
// returns true otherwise...
function installExtension(name, settings) {
    logger.appendLine(`Installing extension: ${name}...`);
    let options = {};
    options.encoding = 'utf8';
    let command = getCodeCommand(settings) + ' --install-extension ';
    command += name;
    let out = new Buffer('');
    try {
        out = child_process.execSync(command, options);
    }
    catch (e) {
        const err = e;
        logger.appendLine('Error while executing installExtension()');
        logger.appendLine(`Command: ${command}`);
        logError(err);
        logger.appendLine('Failing extension installation.');
    }
    if (out.indexOf('is already installed') != -1) {
        logger.appendLine('Extension was already installed.');
        return false;
    }
    else {
        logger.appendLine('Extension installation succeeded.');
        return true;
    }
}
exports.installExtension = installExtension;
function isCodeOnPath(settings) {
    let version = '';
    let command = getCodeCommand(settings) + ' --version';
    try {
        version = child_process.execSync(command, { encoding: 'utf8' });
    }
    catch (e) {
        const err = e;
        logger.appendLine(`Error while executing isCodeOnPath()`);
        logger.appendLine(`Command: ${command}`);
        logError(err);
        logger.appendLine(`Defaulting to false`);
        return false;
    }
    logger.appendLine(`Found code version: ${version}.`);
    if (version != '') {
        return true;
    }
    return false;
}
exports.isCodeOnPath = isCodeOnPath;
function logError(err) {
    logger.appendLine(`Exception:`);
    logger.appendLine(`\tName: ${err.name}`);
    logger.appendLine(`\tMessage: ${err.message}`);
    logger.appendLine(`\tStacktrace: ${err.stack}`);
}
exports.logError = logError;
function getCodeString(settings) {
    if (settings.executableName) {
        logger.appendLine(`Using user defined executable name: ${settings.executableName}`);
        return settings.executableName;
    }
    let codeString = 'code';
    if (isInsiders()) {
        codeString = 'code-insiders';
    }
    return codeString;
}
function isCodeASnapPackage(settings, log = false) {
    let codeString = getCodeString(settings);
    if (linux) {
        const env = process.env;
        if ('SNAP' in env) {
            // VSCode has been installed through Snap so we need to invoke the code binary directly
            let codePath = path.join(env['SNAP'], 'usr/share/code/bin', codeString);
            if (log) {
                logger.appendLine(`Code appears to be running through Snap. Using following as Code path: ${codePath}`);
            }
            return {
                value: true,
                path: codePath
            };
        }
        else {
            return {
                value: false,
                path: null
            };
        }
    }
    else {
        return {
            value: false,
            path: null
        };
    }
}
exports.isCodeASnapPackage = isCodeASnapPackage;
function getCodeCommand(settings) {
    let codeString = getCodeString(settings);
    if (windows) {
        return `${codeString}.cmd`;
    }
    else if (osx) {
        return codeString;
    }
    else if (linux) {
        let result = isCodeASnapPackage(settings);
        if (result.value) {
            return result.path;
        }
        else {
            return codeString;
        }
    }
    else {
        return codeString;
    }
}
/**
 * Given publisher.name-version returns a FolderExtension object with id = publisher.name and
 * version = version. If the folderName is malformed then id = folderName and version will be
 * an empty string
 */
function getFolderExtensionInfo(folderName) {
    let id = '';
    let version = '';
    if (folderName.lastIndexOf('-') != -1) {
        let tmpVersion = folderName.substring(folderName.lastIndexOf('-') + 1);
        if (!isNaN(parseInt(tmpVersion[0])) &&
            !isNaN(parseInt(tmpVersion[tmpVersion.length - 1]))) {
            id = folderName.substring(0, folderName.lastIndexOf('-'));
            version = tmpVersion;
        }
        else {
            id = folderName;
        }
    }
    else {
        id = folderName;
    }
    return {
        id: id,
        version: version
    };
}
exports.getFolderExtensionInfo = getFolderExtensionInfo;
/**
 * Checks if a > b.
 * If a > b return 1
 * If a === b return 0
 * If a < b return -1
 */
function isVersionGreaterThan(a, b) {
    if (a === b) {
        return 0;
    }
    else if ((typeof a !== 'undefined' && typeof b === 'undefined') ||
        (a !== null && b === null)) {
        return 1;
    }
    else if ((typeof a === 'undefined' && typeof b !== 'undefined') ||
        (a === null && b !== null)) {
        return -1;
    }
    else {
        let aSplit = a.split('.');
        let bSplit = b.split('.');
        if (aSplit.length >= bSplit.length) {
            for (let i = 0; i < aSplit.length; i++) {
                let aNum = parseInt(aSplit[i]);
                if (bSplit[i]) {
                    let bNum = parseInt(bSplit[i]);
                    if (aNum > bNum) {
                        return 1;
                    }
                    else if (aNum < bNum) {
                        return -1;
                    }
                }
                else {
                    if (aNum > 0) {
                        return 1;
                    }
                }
            }
        }
        else {
            for (let i = 0; i < bSplit.length; i++) {
                let bNum = parseInt(bSplit[i]);
                if (aSplit[i]) {
                    let aNum = parseInt(aSplit[i]);
                    if (bNum > aNum) {
                        return -1;
                    }
                    else if (bNum < aNum) {
                        return 1;
                    }
                }
                else {
                    if (bNum > 0) {
                        return -1;
                    }
                }
            }
        }
        return 0;
    }
}
exports.isVersionGreaterThan = isVersionGreaterThan;
function isFileEmpty(path) {
    let stats = fs.statSync(path);
    return stats.size == 0;
}
exports.isFileEmpty = isFileEmpty;
function isFileContentEmpty(path) {
    let fileContent = fs.readFileSync(path, 'utf8');
    fileContent = fileContent.trim();
    return fileContent == '';
}
exports.isFileContentEmpty = isFileContentEmpty;
function getCodePathWarningMessage() {
    return 'Code was not found on your path, CodeSync will be unable to import or export your extensions.';
}
exports.getCodePathWarningMessage = getCodePathWarningMessage;
function parseJson(str) {
    return json.parse(str);
}
exports.parseJson = parseJson;
function stringifyJson(obj) {
    return json.stringify(obj, null, 4);
}
exports.stringifyJson = stringifyJson;
//# sourceMappingURL=helpers.js.map