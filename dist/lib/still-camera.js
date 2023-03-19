"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const events_1 = require("events");
const __1 = require("..");
const util_1 = require("../util");
const shared_args_1 = require("./shared-args");
class StillCamera extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {};
        this.showPreview = false;
        this.args = [];
        // defaults
        this.defaultOptions = {
            rotation: __1.Rotation.Rotate0,
            flip: __1.Flip.None,
            delay: 1,
        };
        this.setOptions(options);
    }
    setOptions(options) {
        this.options = Object.assign(Object.assign({}, this.defaultOptions), options);
        // clean previous childProcess
        if (this.showPreview) {
            this.stopPreview();
        }
        this.args = [
            /**
             * Add the command-line arguments that are common to both `raspivid` and `raspistill`
             */
            ...shared_args_1.getSharedArgs(this.options),
            /**
             * Capture delay (ms)
             */
            ...(!this.options.showPreview ? ['--timeout', this.options.delay.toString()] : []),
            /**
             * RAW (Save Bayer Data)
             * This option inserts the raw Bayer data from the camera in to the
             * JPEG metadata.
             */
            ...(this.options.raw ? ['--raw'] : []),
            /**
             * JPEG Quality
             * Quality 100 is almost completely uncompressed. 75 is a good allround value.
             */
            ...(this.options.quality ? ['--quality', this.options.quality.toString()] : []),
            /**
             * Burst
             * This prevents the camera from returning to preview mode in between captures,
             * meaning that captures can be taken closer together.
             */
            ...(this.options.burst ? ['--burst'] : []),
            /**
             * Thumbnail Settings (x:y:quality)
             * Allows specification of the thumbnail image inserted in to the JPEG file.
             * If not specified, defaults are a size of 64x48 at quality 35.
             * `false` will remove the default thumbnail
             */
            ...(Array.isArray(this.options.thumbnail) || this.options.thumbnail === false
                ? ['--thumb', !this.options.thumbnail ? 'none' : this.options.thumbnail.join(':')]
                : []),
            /**
             * Exif information
             * Allows the insertion of specific EXIF tags into the JPEG image.
             * You can have up to 32 EXIF tag entries.
             * Will overwrite any EXIF tag set automatically by the camera.
             */
            ...(this.options.exif
                ? Object.keys(this.options.exif).flatMap(key => [
                    '--exif',
                    `${key}=${this.options.exif[key]}`,
                ])
                : []),
            // `false` will remove all the default EXIF information
            ...(this.options.exif === false ? ['--exif', 'none'] : []),
            /**
             * GPS Exif
             * Applies real-time EXIF information from any attached GPS dongle (using GSPD) to the image
             * (requires libgps.so to be installed)
             */
            ...(this.options.gpsExif ? ['--gpsexif'] : []),
            /**
             * Specifies the first frame number
             * To be used combined with %08d in the filename output
             */
            ...(this.options.frameStart ? ['--framestart', this.options.frameStart.toString()] : []),
            /**
             * Makes a file system link under this name to the latest frame.
             */
            ...(this.options.latest ? ['--latest', this.options.latest] : []),
            /**
             * Output to file or stdout
             */
            ...['--output', this.options.output ? this.options.output.toString() : '-'],
        ];
        if (this.options.showPreview) {
            this.startPreview();
        }
    }
    startPreview() {
        try {
            this.childProcess = child_process_1.spawn('raspistill', this.args);
            // Listen for error event to reject promise
            this.childProcess.once('error', err => {
                this.emit('error', err);
            });
            let stdoutBuffer = Buffer.alloc(0);
            // Embebed thumnbail support
            let countEnd = 0;
            let countStart = 0;
            // Listen for image data events and parse MJPEG frames if codec is MJPEG
            this.childProcess.stdout.on('data', (data) => {
                stdoutBuffer = Buffer.concat([stdoutBuffer, data]);
                // Count the JPEG starts and ends of JPEG signatures
                // If the image has embebed preview, the start index match two times
                countStart += util_1.indexOfAll(data, StillCamera.jpegSignature);
                countEnd += util_1.indexOfAll(data, StillCamera.jpegSignatureEnd);
                // Extract all image frames from the current buffer
                while (true) {
                    const signatureIndex = stdoutBuffer.indexOf(StillCamera.jpegSignature);
                    if (signatureIndex === -1)
                        break;
                    // Make sure the signature starts at the beginning of the buffer
                    if (signatureIndex > 0)
                        stdoutBuffer = stdoutBuffer.slice(signatureIndex);
                    if (countEnd !== countStart)
                        break;
                    this.emit('frame', stdoutBuffer);
                    countEnd = 0;
                    countStart = 0;
                    stdoutBuffer = Buffer.alloc(0);
                    break;
                }
            });
            // Listen for error events
            this.childProcess.stdout.on('error', err => this.emit('error', err));
            this.childProcess.stderr.on('data', data => this.emit('error', new Error(data.toString())));
            this.childProcess.stderr.on('error', err => this.emit('error', err));
            // Listen for close events
            this.childProcess.stdout.once('close', () => {
                this.stopPreview();
                this.emit('close');
            });
            this.showPreview = true;
        }
        catch (err) {
            this.stopPreview();
            this.emit('error', err.code === 'ENOENT'
                ? new Error("Could not initialize StillCamera. Are you running on a Raspberry Pi with 'raspistill' installed?")
                : err);
        }
    }
    takeImage() {
        try {
            if (this.showPreview) {
                return new Promise((resolve, reject) => {
                    if (!this.options.output) {
                        this.once('frame', data => resolve(data));
                    }
                    if (this.childProcess) {
                        // send character to take the picture
                        this.childProcess.stdin.write('-', err => {
                            if (err)
                                reject(err);
                            if (this.options.output) {
                                resolve(null);
                            }
                        });
                    }
                });
            }
            return util_1.spawnPromise('raspistill', this.args);
        }
        catch (err) {
            const error = err.code === 'ENOENT'
                ? new Error("Could not take image with StillCamera. Are you running on a Raspberry Pi with 'raspistill' installed?")
                : err;
            this.emit('error', error);
            throw error;
        }
    }
    stopPreview() {
        if (!this.showPreview)
            return;
        this.showPreview = false;
        if (this.childProcess) {
            this.childProcess.stdout.removeAllListeners();
            this.childProcess.kill();
        }
    }
}
StillCamera.jpegSignature = Buffer.from([0xff, 0xd8]);
StillCamera.jpegSignatureEnd = Buffer.from([0xff, 0xd9]);
exports.default = StillCamera;
//# sourceMappingURL=still-camera.js.map