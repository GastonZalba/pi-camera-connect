"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const perf_hooks_1 = require("perf_hooks");
const still_camera_1 = require("./still-camera");
const TEST_IMAGES_DIR = 'test_images';
if (!fs.existsSync(TEST_IMAGES_DIR)) {
    fs.mkdirSync(TEST_IMAGES_DIR);
}
test('takeImage() returns JPEG', async () => {
    const t0 = perf_hooks_1.performance.now();
    const stillCamera = new still_camera_1.default();
    const jpegImage = await stillCamera.takeImage();
    const t1 = perf_hooks_1.performance.now();
    const time = ((t1 - t0) / 1000).toFixed(2);
    await fs.promises.writeFile(`test_images/stillCapture_(${time}-secs).jpeg`, jpegImage, 'binary');
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
    await fs.promises.writeFile(`test_images/stillCapture_live_(${time}-secs).jpeg`, jpegImage, 'binary');
    expect(jpegImage.indexOf(still_camera_1.default.jpegSignature)).toBe(0);
});
//# sourceMappingURL=still-camera.test.js.map