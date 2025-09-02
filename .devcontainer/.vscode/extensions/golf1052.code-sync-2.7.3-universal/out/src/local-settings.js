'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalSettings = exports.LOCAL_SETTINGS = void 0;
const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");
const logger_1 = require("./logger");
exports.LOCAL_SETTINGS = 'local-settings.json';
class LocalSettings {
    constructor(codeSyncExtensionDir) {
        this.logger = new logger_1.Logger('local-settings');
        this.codeSyncExtensionDir = codeSyncExtensionDir;
    }
    import(externalSettingsPath, internalSettingsPath) {
        let localSettingsPath = path.join(this.codeSyncExtensionDir, exports.LOCAL_SETTINGS);
        let settings = helpers.parseJson(fs.readFileSync(externalSettingsPath, 'utf8'));
        if (fs.existsSync(localSettingsPath)) {
            this.logger.appendLine('Modifying settings with local settings.');
            let localSettings = helpers.parseJson(fs.readFileSync(localSettingsPath, 'utf8'));
            let localSettingsKeys = Object.keys(localSettings);
            localSettingsKeys.forEach(key => {
                settings[key] = localSettings[key];
            });
        }
        this.logger.appendLine('Saving imported settings.');
        fs.writeFileSync(internalSettingsPath, helpers.stringifyJson(settings));
    }
    export(internalSettingsPath, externalSettingsPath) {
        let localSettingsPath = path.join(this.codeSyncExtensionDir, exports.LOCAL_SETTINGS);
        let settings = helpers.parseJson(fs.readFileSync(internalSettingsPath, 'utf8'));
        if (!fs.existsSync(localSettingsPath)) {
            fs.writeFileSync(localSettingsPath, helpers.stringifyJson({}));
        }
        if (fs.existsSync(localSettingsPath)) {
            let localSettings = helpers.parseJson(fs.readFileSync(localSettingsPath, 'utf8'));
            let localSettingsKeys = Object.keys(localSettings);
            localSettingsKeys.forEach(key => {
                delete settings[key];
            });
        }
        fs.writeFileSync(externalSettingsPath, helpers.stringifyJson(settings));
    }
}
exports.LocalSettings = LocalSettings;
//# sourceMappingURL=local-settings.js.map