"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var still_camera_1 = require("./lib/still-camera");
exports.StillCamera = still_camera_1.default;
var stream_camera_1 = require("./lib/stream-camera");
exports.StreamCamera = stream_camera_1.default;
exports.Codec = stream_camera_1.Codec;
exports.SensorMode = stream_camera_1.SensorMode;
var Rotation;
(function (Rotation) {
    Rotation[Rotation["Rotate0"] = 0] = "Rotate0";
    Rotation[Rotation["Rotate90"] = 90] = "Rotate90";
    Rotation[Rotation["Rotate180"] = 180] = "Rotate180";
    Rotation[Rotation["Rotate270"] = 270] = "Rotate270";
})(Rotation = exports.Rotation || (exports.Rotation = {}));
var Flip;
(function (Flip) {
    Flip["None"] = "none";
    Flip["Horizontal"] = "horizontal";
    Flip["Vertical"] = "vertical";
    Flip["Both"] = "both";
})(Flip = exports.Flip || (exports.Flip = {}));
var ExposureMode;
(function (ExposureMode) {
    ExposureMode["Off"] = "off";
    ExposureMode["Auto"] = "auto";
    ExposureMode["Night"] = "night";
    ExposureMode["NightPreview"] = "nightpreview";
    ExposureMode["Backlight"] = "backlight";
    ExposureMode["Spotlight"] = "spotlight";
    ExposureMode["Sports"] = "sports";
    ExposureMode["Snow"] = "snow";
    ExposureMode["Beach"] = "beach";
    ExposureMode["VeryLong"] = "verylong";
    ExposureMode["FixedFps"] = "fixedfps";
    ExposureMode["AntiShake"] = "antishake";
    ExposureMode["Fireworks"] = "fireworks";
})(ExposureMode = exports.ExposureMode || (exports.ExposureMode = {}));
var AwbMode;
(function (AwbMode) {
    AwbMode["Off"] = "off";
    AwbMode["Auto"] = "auto";
    AwbMode["Sun"] = "sun";
    AwbMode["Cloud"] = "cloud";
    AwbMode["Shade"] = "shade";
    AwbMode["Tungsten"] = "tungsten";
    AwbMode["Fluorescent"] = "fluorescent";
    AwbMode["Incandescent"] = "incandescent";
    AwbMode["Flash"] = "flash";
    AwbMode["Horizon"] = "horizon";
    AwbMode["GreyWorld"] = "greyworld";
})(AwbMode = exports.AwbMode || (exports.AwbMode = {}));
var ImxfxMode;
(function (ImxfxMode) {
    ImxfxMode["None"] = "none";
    ImxfxMode["Negative"] = "negative";
    ImxfxMode["Solarise"] = "solarise";
    ImxfxMode["Sketch"] = "sketch";
    ImxfxMode["Denoise"] = "denoise";
    ImxfxMode["Emboss"] = "emboss";
    ImxfxMode["OilPaint"] = "oilpaint";
    ImxfxMode["Hatch"] = "hatch";
    ImxfxMode["GPen"] = "gpen";
    ImxfxMode["Pastel"] = "pastel";
    ImxfxMode["Watercolour"] = "watercolour";
    ImxfxMode["Film"] = "film";
    ImxfxMode["Blur"] = "blur";
    ImxfxMode["Saturation"] = "saturation";
    ImxfxMode["ColourSwap"] = "colourswap";
    ImxfxMode["WashedOut"] = "washedout";
    ImxfxMode["Posterise"] = "posterise";
    ImxfxMode["ColourPoint"] = "colourpoint";
    ImxfxMode["ColourBalance"] = "colourbalance";
    ImxfxMode["Cartoon"] = "cartoon";
})(ImxfxMode = exports.ImxfxMode || (exports.ImxfxMode = {}));
var DynamicRange;
(function (DynamicRange) {
    DynamicRange["Off"] = "off";
    DynamicRange["Low"] = "low";
    DynamicRange["Medium"] = "medium";
    DynamicRange["High"] = "high";
})(DynamicRange = exports.DynamicRange || (exports.DynamicRange = {}));
var MeteringMode;
(function (MeteringMode) {
    MeteringMode["Average"] = "average";
    MeteringMode["Spot"] = "spot";
    MeteringMode["Backlit"] = "backlit";
    MeteringMode["Matrix"] = "matrix";
})(MeteringMode = exports.MeteringMode || (exports.MeteringMode = {}));
var FlickerMode;
(function (FlickerMode) {
    FlickerMode["Off"] = "off";
    FlickerMode["Auto"] = "auto";
    FlickerMode["50hz"] = "50hz";
    FlickerMode["60Hz"] = "60hz";
})(FlickerMode = exports.FlickerMode || (exports.FlickerMode = {}));
var DisplayNumber;
(function (DisplayNumber) {
    DisplayNumber[DisplayNumber["DSI/DPI LCD"] = 0] = "DSI/DPI LCD";
    DisplayNumber[DisplayNumber["HDMI0"] = 2] = "HDMI0";
    DisplayNumber[DisplayNumber["SDTV"] = 3] = "SDTV";
    DisplayNumber[DisplayNumber["HDMI1"] = 7] = "HDMI1";
})(DisplayNumber = exports.DisplayNumber || (exports.DisplayNumber = {}));
//# sourceMappingURL=index.js.map