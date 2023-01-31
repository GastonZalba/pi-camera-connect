"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const events_1 = require("events");
const stream = require("stream");
const __1 = require("..");
const shared_args_1 = require("./shared-args");
var Codec;
(function (Codec) {
    Codec["H264"] = "H264";
    Codec["MJPEG"] = "MJPEG";
})(Codec = exports.Codec || (exports.Codec = {}));
var SensorMode;
(function (SensorMode) {
    SensorMode[SensorMode["AutoSelect"] = 0] = "AutoSelect";
    SensorMode[SensorMode["Mode1"] = 1] = "Mode1";
    SensorMode[SensorMode["Mode2"] = 2] = "Mode2";
    SensorMode[SensorMode["Mode3"] = 3] = "Mode3";
    SensorMode[SensorMode["Mode4"] = 4] = "Mode4";
    SensorMode[SensorMode["Mode5"] = 5] = "Mode5";
    SensorMode[SensorMode["Mode6"] = 6] = "Mode6";
    SensorMode[SensorMode["Mode7"] = 7] = "Mode7";
})(SensorMode = exports.SensorMode || (exports.SensorMode = {}));
class StreamCamera extends events_1.EventEmitter {
    constructor(options = {}) {
        var _a;
        super();
        this.streams = [];
        this.options = Object.assign({ rotation: __1.Rotation.Rotate0, flip: __1.Flip.None, bitRate: 17000000, fps: 30, codec: Codec.H264, sensorMode: SensorMode.AutoSelect }, options);
        this.livePreview = !!((_a = this.options.showPreview) !== null && _a !== void 0 ? _a : this.options.fullscreen);
    }
    startCapture() {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            // TODO: refactor promise logic to be more ergonomic
            // so that we don't need to try/catch here
            try {
                const args = [
                    /**
                     * Add the command-line arguments that are common to both `raspivid` and `raspistill`
                     */
                    ...shared_args_1.getSharedArgs(this.options),
                    /**
                     * Bit rate
                     */
                    ...(this.options.bitRate ? ['--bitrate', this.options.bitRate.toString()] : []),
                    /**
                     * Frame rate
                     */
                    ...(this.options.fps ? ['--framerate', this.options.fps.toString()] : []),
                    /**
                     * Codec
                     *
                     * H264 or MJPEG
                     *
                     */
                    ...(this.options.codec ? ['--codec', this.options.codec.toString()] : []),
                    /**
                     * Sensor mode
                     *
                     * Camera version 1.x (OV5647):
                     *
                     * | Mode |        Size         | Aspect Ratio | Frame rates |   FOV   |    Binning    |
                     * |------|---------------------|--------------|-------------|---------|---------------|
                     * |    0 | automatic selection |              |             |         |               |
                     * |    1 | 1920x1080           | 16:9         | 1-30fps     | Partial | None          |
                     * |    2 | 2592x1944           | 4:3          | 1-15fps     | Full    | None          |
                     * |    3 | 2592x1944           | 4:3          | 0.1666-1fps | Full    | None          |
                     * |    4 | 1296x972            | 4:3          | 1-42fps     | Full    | 2x2           |
                     * |    5 | 1296x730            | 16:9         | 1-49fps     | Full    | 2x2           |
                     * |    6 | 640x480             | 4:3          | 42.1-60fps  | Full    | 2x2 plus skip |
                     * |    7 | 640x480             | 4:3          | 60.1-90fps  | Full    | 2x2 plus skip |
                     *
                     *
                     * Camera version 2.x (IMX219):
                     *
                     * | Mode |        Size         | Aspect Ratio | Frame rates |   FOV   | Binning |
                     * |------|---------------------|--------------|-------------|---------|---------|
                     * |    0 | automatic selection |              |             |         |         |
                     * |    1 | 1920x1080           | 16:9         | 0.1-30fps   | Partial | None    |
                     * |    2 | 3280x2464           | 4:3          | 0.1-15fps   | Full    | None    |
                     * |    3 | 3280x2464           | 4:3          | 0.1-15fps   | Full    | None    |
                     * |    4 | 1640x1232           | 4:3          | 0.1-40fps   | Full    | 2x2     |
                     * |    5 | 1640x922            | 16:9         | 0.1-40fps   | Full    | 2x2     |
                     * |    6 | 1280x720            | 16:9         | 40-90fps    | Partial | 2x2     |
                     * |    7 | 640x480             | 4:3          | 40-90fps    | Partial | 2x2     |
                     *
                     */
                    ...(this.options.sensorMode ? ['--mode', this.options.sensorMode.toString()] : []),
                    /**
                     * Capture time (ms)
                     *
                     * Zero = forever
                     *
                     */
                    '--timeout',
                    (0).toString(),
                    /**
                     * Output to stdout
                     */
                    '--output',
                    '-',
                ];
                // Spawn child process
                this.childProcess = child_process_1.spawn('raspivid', args);
                // Listen for error event to reject promise
                this.childProcess.once('error', () => reject(new Error("Could not start capture with StreamCamera. Are you running on a Raspberry Pi with 'raspivid' installed?")));
                // Wait for first data event to resolve promise
                this.childProcess.stdout.once('data', () => resolve());
                let stdoutBuffer = Buffer.alloc(0);
                // Listen for image data events and parse MJPEG frames if codec is MJPEG
                this.childProcess.stdout.on('data', (data) => {
                    this.streams.forEach(stream => stream.push(data));
                    if (this.options.codec !== Codec.MJPEG)
                        return;
                    stdoutBuffer = Buffer.concat([stdoutBuffer, data]);
                    // Extract all image frames from the current buffer
                    while (true) {
                        const signatureIndex = stdoutBuffer.indexOf(StreamCamera.jpegSignature, 0);
                        if (signatureIndex === -1)
                            break;
                        // Make sure the signature starts at the beginning of the buffer
                        if (signatureIndex > 0)
                            stdoutBuffer = stdoutBuffer.slice(signatureIndex);
                        const nextSignatureIndex = stdoutBuffer.indexOf(StreamCamera.jpegSignature, StreamCamera.jpegSignature.length);
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
            }
            catch (err) {
                return reject(err);
            }
        });
    }
    async stopCapture() {
        if (this.childProcess) {
            this.childProcess.kill();
        }
        // Push null to each stream to indicate EOF
        // tslint:disable-next-line no-null-keyword
        this.streams.forEach(stream => stream.push(null));
        this.streams = [];
    }
    createStream() {
        const newStream = new stream.Readable({
            read: () => { },
        });
        this.streams.push(newStream);
        return newStream;
    }
    takeImage() {
        if (this.options.codec !== Codec.MJPEG)
            throw new Error("Codec must be 'MJPEG' to take image");
        return new Promise(resolve => this.once('frame', data => resolve(data)));
    }
    /**
     * @TODO
     */
    stopPreview() {
    }
}
StreamCamera.jpegSignature = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x84, 0x00]);
exports.default = StreamCamera;
//# sourceMappingURL=stream-camera.js.map