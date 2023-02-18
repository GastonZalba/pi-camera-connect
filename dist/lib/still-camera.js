"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const events_1 = require("events");
const __1 = require("..");
const util_1 = require("../util");
const shared_args_1 = require("./shared-args");
class StillCamera extends events_1.EventEmitter {
    // static readonly jpegSignature = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x84, 0x00]);
    constructor(options = {}) {
        super();
        this.options = {};
        this.livePreview = false;
        this.streams = [];
        this.args = [];
        this.init(options);
    }
    init(options) {
        this.options = Object.assign({ rotation: __1.Rotation.Rotate0, flip: __1.Flip.None, delay: 1 }, options);
        // clean previous childProcess
        if (this.livePreview) {
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
            '--timeout',
            this.options.delay.toString(),
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
             */
            ...(this.options.thumbnail
                ? [
                    '--thumb',
                    Array.isArray(this.options.thumbnail)
                        ? this.options.thumbnail.join(':')
                        : this.options.thumbnail,
                ]
                : []),
            /**
             * Output to stdout
             */
            '--output',
            '-',
        ];
        if (this.options.showPreview) {
            this.startPreview();
        }
    }
    async startPreview() {
        this.livePreview = true;
        try {
            // eslint-disable-next-line no-async-promise-executor
            return await new Promise((resolve, reject) => {
                // TODO: refactor promise logic to be more ergonomic
                // so that we don't need to try/catch here
                // Spawn child process
                this.childProcess = child_process_1.spawn('raspistill', this.args);
                // Listen for error event to reject promise
                this.childProcess.once('error', err => reject(err));
                // Wait for first data event to resolve promise
                this.childProcess.stdout.once('data', () => resolve());
                let stdoutBuffer = Buffer.alloc(0);
                // Listen for image data events and parse MJPEG frames if codec is MJPEG
                this.childProcess.stdout.on('data', (data) => {
                    this.streams.forEach(stream => stream.push(data));
                    stdoutBuffer = Buffer.concat([stdoutBuffer, data]);
                    // Extract all image frames from the current buffer
                    while (true) {
                        const signatureIndex = stdoutBuffer.indexOf(StillCamera.jpegSignature, 0);
                        if (signatureIndex === -1)
                            break;
                        // Make sure the signature starts at the beginning of the buffer
                        if (signatureIndex > 0)
                            stdoutBuffer = stdoutBuffer.slice(signatureIndex);
                        const nextSignatureIndex = stdoutBuffer.indexOf(StillCamera.jpegSignature, StillCamera.jpegSignature.length);
                        if (nextSignatureIndex === -1)
                            break;
                        this.emit('frame', stdoutBuffer.slice(0, nextSignatureIndex));
                        stdoutBuffer = stdoutBuffer.slice(nextSignatureIndex);
                    }
                });
                // Listen for error events
                this.childProcess.stdout.on('error', err => this.emit('error', err));
                this.childProcess.stderr.on('data', data => this.emit('error', new Error(data.toString())));
                this.childProcess.stderr.on('error', err => this.emit('error', err));
                // Listen for close events
                this.childProcess.stdout.on('close', () => this.emit('close'));
            });
        }
        catch (err) {
            this.emit('error', err.code === 'ENOENT'
                ? new Error("Could not initialize the preview with StillCamera. Are you running on a Raspberry Pi with 'raspistill' installed?")
                : err);
        }
    }
    async takeImage() {
        try {
            if (this.livePreview) {
                return await new Promise(resolve => {
                    this.once('frame', data => resolve(data));
                    if (this.childProcess) {
                        this.childProcess.stdin.write('-');
                        this.childProcess.stdin.end();
                    }
                });
            }
            return await util_1.spawnPromise('raspistill', this.args);
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                throw new Error("Could not take image with StillCamera. Are you running on a Raspberry Pi with 'raspistill' installed?");
            }
            this.emit('error', err);
            throw err;
        }
    }
    updateOptions(options) {
        this.init(options);
    }
    stopPreview() {
        if (!this.livePreview)
            return;
        if (this.childProcess) {
            this.childProcess.kill();
        }
        // Push null to each stream to indicate EOF
        // tslint:disable-next-line no-null-keyword
        this.streams.forEach(stream => stream.push(null));
        this.streams = [];
        this.livePreview = false;
    }
}
StillCamera.jpegSignature = Buffer.from([0xff, 0xd8, 0xff, 0xe1]);
exports.default = StillCamera;
//# sourceMappingURL=still-camera.js.map