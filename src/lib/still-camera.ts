import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as stream from 'stream';
import { AwbMode, DynamicRange, ExposureMode, Flip, ImxfxMode, Rotation } from '..';
import { spawnPromise } from '../util';
import { getSharedArgs } from './shared-args';

export interface StillOptions {
  width?: number;
  height?: number;
  rotation?: Rotation;
  flip?: Flip;
  delay?: number;
  shutter?: number;
  sharpness?: number;
  contrast?: number;
  brightness?: number;
  saturation?: number;
  iso?: number;
  exposureCompensation?: number;
  exposureMode?: ExposureMode;
  awbMode?: AwbMode;
  analogGain?: number;
  digitalGain?: number;
  imageEffect?: ImxfxMode;
  colourEffect?: [number, number]; // U,V
  dynamicRange?: DynamicRange;
  videoStabilisation?: boolean;
  raw?: boolean;
  quality?: number;
}

export default class StillCamera extends EventEmitter {
  private readonly options: StillOptions;

  static readonly jpegSignature = Buffer.from([0xff, 0xd8, 0xff, 0xe1]);

  private livePreview: boolean;
  private childProcess?: ChildProcessWithoutNullStreams;
  private streams: Array<stream.Readable> = [];
  private args: Array<string>

  //static readonly jpegSignature = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x84, 0x00]);

  constructor(options: StillOptions = {}) {
    super();

    this.options = {
      rotation: Rotation.Rotate0,
      flip: Flip.None,
      delay: 1,
      ...options,
    };

    this.livePreview = false;

    this.args = [
      /**
       * Add the command-line arguments that are common to both `raspivid` and `raspistill`
       */
      ...getSharedArgs(this.options),

      /**
       * Capture delay (ms)
       */
      '--timeout',
      this.options.delay!.toString(),

      /**
      * RAW (Save Bayer Data)
      */
      ...(this.options.raw ? ['--raw'] : []),

      /**
       * JPEG Quality)
       */
      ...(this.options.quality ? ['--quality', this.options.quality.toString()] : []),

      /**
       * Output to stdout
       */
      '--output',
      '-',
    ]
  }

  async takeImage() {
    try {
      if (this.livePreview && this.childProcess) {
        return new Promise<Buffer>(resolve => {
          this.once('frame', data => resolve(data));
          this.childProcess.stdin.write('-');
          this.childProcess.stdin.end();
        });
      } else {
        return await spawnPromise('raspistill', [
          ...this.args,
          /**
            * Do not display preview overlay on screen
            */
          '--nopreview'
        ]);
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(
          "Could not take image with StillCamera. Are you running on a Raspberry Pi with 'raspistill' installed?",
        );
      }

      throw err;
    }
  }

  startPreview(preview: [number, number, number, number]): Promise<void> {
    this.livePreview = true;

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      // TODO: refactor promise logic to be more ergonomic
      // so that we don't need to try/catch here
      try {
        const args = [...this.args,
          '--preview', preview.toString(),
          '--keypress'
        ];

        // Spawn child process
        this.childProcess = spawn('raspistill', args);

        // Listen for error event to reject promise
        this.childProcess.once('error', () =>
          reject(
            new Error(
              "Could not start preview with StillCamera",
            ),
          ),
        );

        // Wait for first data event to resolve promise
        this.childProcess.stdout.once('data', () => resolve());

        let stdoutBuffer = Buffer.alloc(0);

        // Listen for image data events and parse MJPEG frames if codec is MJPEG
        this.childProcess.stdout.on('data', (data: Buffer) => {
          this.streams.forEach(stream => stream.push(data));

          stdoutBuffer = Buffer.concat([stdoutBuffer, data]);

          // Extract all image frames from the current buffer
          while (true) {
            const signatureIndex = stdoutBuffer.indexOf(StillCamera.jpegSignature, 0);

            if (signatureIndex === -1) break;

            // Make sure the signature starts at the beginning of the buffer
            if (signatureIndex > 0) stdoutBuffer = stdoutBuffer.slice(signatureIndex);

            const nextSignatureIndex = stdoutBuffer.indexOf(
              StillCamera.jpegSignature,
              StillCamera.jpegSignature.length,
            );

            if (nextSignatureIndex === -1) break;

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
      } catch (err) {
        return reject(err);
      }
    });
  }

  async stopPreview() {
    if (!this.livePreview) return;

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
