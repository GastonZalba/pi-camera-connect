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
        super();
        this.options = {};
        this.showPreview = false;
        this.streams = [];
        this.args = [];
        // defaults
        this.defaultOptions = {
            rotation: __1.Rotation.Rotate0,
            flip: __1.Flip.None,
            bitRate: 17000000,
            fps: 30,
            codec: Codec.H264,
            sensorMode: SensorMode.AutoSelect,
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
             * |    7 | 640x480             | 4:3          | 40-200fps*  | Partial | 2x2     |
             *
             * *For frame rates over 120fps, it is necessary to turn off automatic exposure and gain
             * control using -ex off. Doing so should achieve the higher frame rates, but exposure
             * time and gains will need to be set to fixed values supplied by the user.
             *
             *
             * HQ Camera (IMX477):
             *
             * | Mode |        Size         | Aspect Ratio | Frame rates |   FOV   |   Binning   |
             * |------|---------------------|--------------|-------------|---------|-------------|
             * |    0 | automatic selection |              |             |         |             |
             * |    1 | 2028x1080           | 169:90       | 0.1-50fps   | Partial | 2x2 binned  |
             * |    2 | 2028x1520           | 4:3          | 0.1-50fps   | Full    | 2x2 binned  |
             * |    3 | 4056x3040           | 4:3          | 0.005-10fps | Full    | None        |
             * |    4 | 1332x990            | 74:55        | 50.1-120fps | Partial | 2x2 binned  |
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
             * Output to file or stdout
             */
            ...['--output', this.options.output ? this.options.output.toString() : '-'],
        ];
        if (this.options.showPreview) {
            this.startPreview();
        }
    }
    startCapture() {
        return new Promise((resolve, reject) => {
            // TODO: refactor promise logic to be more ergonomic
            // so that we don't need to try/catch here
            try {
                if (!this.childProcess) {
                    this.childProcess = this.initChildProcess();
                }
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
                if (this.showPreview) {
                    // send character to init the capture
                    this.childProcess.stdin.write('-');
                    this.childProcess.stdin.end();
                }
            }
            catch (err) {
                return reject(err);
            }
        });
    }
    initChildProcess() {
        // Spawn child process
        const childProcess = child_process_1.spawn('raspivid', this.args);
        // Listen for error event to reject promise
        childProcess.once('error', () => {
            throw new Error("Could not start StreamCamera. Are you running on a Raspberry Pi with 'raspivid' installed?");
        });
        // Listen for error events
        childProcess.stdout.on('error', err => this.emit('error', err));
        childProcess.stderr.on('data', data => this.emit('error', new Error(data.toString())));
        childProcess.stderr.on('error', err => this.emit('error', err));
        // Listen for close events
        childProcess.stdout.on('close', () => this.emit('close'));
        return childProcess;
    }
    stopCapture() {
        if (this.childProcess) {
            // If preview is active, don't kill the process, only stop the capture
            if (this.showPreview) {
                // send character to init the capture
                this.childProcess.stdin.write('-');
                this.childProcess.stdin.end();
            }
            else {
                this.childProcess.kill();
            }
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
    startPreview() {
        this.childProcess = this.initChildProcess();
        this.showPreview = true;
    }
    stopPreview() {
        if (!this.showPreview || !this.childProcess)
            return;
        this.childProcess.kill();
        this.showPreview = false;
    }
}
StreamCamera.jpegSignature = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x84, 0x00]);
exports.default = StreamCamera;
//# sourceMappingURL=stream-camera.js.map