"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const perf_hooks_1 = require("perf_hooks");
const __1 = require("..");
const still_camera_1 = require("./still-camera");
const TEST_IMAGES_DIR = 'test_images';
if (!fs.existsSync(TEST_IMAGES_DIR)) {
    fs.mkdirSync(TEST_IMAGES_DIR);
}
test('takeImage() returns JPEG', async () => {
    const t0 = perf_hooks_1.performance.now();
    const stillCamera = new still_camera_1.default({
        imageEffectMode: __1.ImageEffectMode.Sketch,
        // 2X zoom
        roi: [0.25, 0.25, 0.5, 0.5],
        // Size 50 black text on white background
        annotateExtra: [50, '0x00', '0x8080FF'],
        // Custom text and Date/Time
        annotate: [4, 'pi-camera-connect %Y-%m-%d %X'],
        exif: {
            'IFD0.Artist': 'pi-camera-connect',
            'IFD0.ImageDescription': 'This is a custom description',
        },
    });
    const jpegImage = await stillCamera.takeImage();
    const t1 = perf_hooks_1.performance.now();
    const time = ((t1 - t0) / 1000).toFixed(2);
    await fs.promises.writeFile(`${TEST_IMAGES_DIR}/stillCapture_(${time}-secs).jpeg`, jpegImage, 'binary');
    expect(jpegImage.indexOf(still_camera_1.default.jpegSignature)).toBe(0);
});
test('takeImage with live preview, returns JPEG', async () => {
    const t0 = perf_hooks_1.performance.now();
    const stillCamera = new still_camera_1.default({
        showPreview: [100, 100, 100, 100],
    });
    const jpegImage = await stillCamera.takeImage();
    const t1 = perf_hooks_1.performance.now();
    const time = ((t1 - t0) / 1000).toFixed(2);
    await fs.promises.writeFile(`${TEST_IMAGES_DIR}/stillCapture_live_(${time}-secs).jpeg`, jpegImage, 'binary');
    expect(jpegImage.indexOf(still_camera_1.default.jpegSignature)).toBe(0);
});
//# sourceMappingURL=still-camera.test.js.map