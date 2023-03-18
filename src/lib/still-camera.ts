import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { EventEmitter } from 'events';
import {
  AwbMode,
  DisplayNumber,
  DynamicRange,
  ExposureMode,
  FlickerMode,
  Flip,
  ImageEffectMode,
  MeteringMode,
  Rotation,
} from '..';
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
  awbGains?: [number, number];
  analogGain?: number;
  digitalGain?: number;
  imageEffectMode?: ImageEffectMode;
  colorEffect?: [number, number]; // U,V
  dynamicRange?: DynamicRange;
  videoStabilization?: boolean;
  raw?: boolean;
  quality?: number;
  statistics?: boolean;
  thumbnail?: [number, number, number] | false; // X, Y, Q
  meteringMode?: MeteringMode;
  flickerMode?: FlickerMode;
  burst?: boolean;
  roi?: [number, number, number, number]; // X, Y, W, H
  showPreview?: [number, number, number, number] | 'fullscreen' | false; // X,Y,W,H
  opacityPreview?: number;
  displayNumber?: DisplayNumber;
  exif?: { [key: string]: string | number } | false;
  gpsExif?: boolean;
  annotate?: (number | string)[];
  annotateExtra?: [number, string, string]; // fontSize, fontColor, backgroundColor
  output?: string;
  frameStart?: number;
}

declare interface StillCamera {
  on(event: 'frame', listener: (image: Buffer) => void): this;
  once(event: 'frame', listener: (image: Buffer) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  once(event: 'error', listener: (error: Error) => void): this;
}

class StillCamera extends EventEmitter {
  private options: StillOptions = {};
  private readonly defaultOptions: StillOptions;

  static readonly jpegSignature = Buffer.from([0xff, 0xd8, 0xff, 0xe1]);
  static readonly jpegSignatureEnd = Buffer.from([0xff, 0xd9]);

  private showPreview: boolean = false;
  private childProcess?: ChildProcessWithoutNullStreams;
  private args: Array<string> = [];

  constructor(options: StillOptions = {}) {
    super();

    // defaults
    this.defaultOptions = {
      rotation: Rotation.Rotate0,
      flip: Flip.None,
      delay: 1,
    };

    this.setOptions(options);
  }

  setOptions(options: StillOptions): void {
    this.options = {
      ...this.defaultOptions,
      ...options,
    };

    // clean previous childProcess
    if (this.showPreview) {
      this.stopPreview();
    }

    this.args = [
      /**
       * Add the command-line arguments that are common to both `raspivid` and `raspistill`
       */
      ...getSharedArgs(this.options),

      /**
       * Capture delay (ms)
       */
      ...(!this.options.showPreview ? ['--timeout', this.options.delay!.toString()] : []),

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
            `${key}=${(this.options.exif as any)[key as keyof StillOptions['exif']]}`,
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
       * Output to file or stdout
       */
      ...['--output', this.options.output ? this.options.output.toString() : '-'],
    ];

    if (this.options.showPreview) {
      this.startPreview();
    }
  }

  private startPreview(): void {
    try {
      this.childProcess = spawn('raspistill', this.args);
      // Listen for error event to reject promise
      this.childProcess.once('error', err => {
        this.emit('error', err);
      });

      let stdoutBuffer = Buffer.alloc(0);

      // Embebed thumbail support
      let countStart = 0;
      let countEnd = 0;

      // Listen for image data events and parse MJPEG frames if codec is MJPEG
      this.childProcess.stdout.on('data', (data: Buffer) => {
        const isJpegStart = data.indexOf(StillCamera.jpegSignature, 0);

        if (isJpegStart) countStart += 1;

        stdoutBuffer = Buffer.concat([stdoutBuffer, data]);

        // Extract all image frames from the current buffer
        while (true) {
          const signatureIndex = stdoutBuffer.indexOf(StillCamera.jpegSignature, 0);

          if (signatureIndex === -1) break;

          // Make sure the signature starts at the beginning of the buffer
          if (signatureIndex > 0) stdoutBuffer = stdoutBuffer.slice(signatureIndex);

          const endSignatureIndex = stdoutBuffer.indexOf(StillCamera.jpegSignatureEnd, 0);

          if (endSignatureIndex !== -1) countEnd += 1;

          if (endSignatureIndex === -1 || countStart === countEnd) break;

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
    } catch (err) {
      this.stopPreview();
      this.emit(
        'error',
        (err as NodeJS.ErrnoException).code === 'ENOENT'
          ? new Error(
              "Could not initialize StillCamera. Are you running on a Raspberry Pi with 'raspistill' installed?",
            )
          : err,
      );
    }
  }

  takeImage(): Promise<Buffer | null> {
    try {
      if (this.showPreview) {
        return new Promise<Buffer | null>((resolve, reject) => {
          if (!this.options.output) {
            this.once('frame', data => resolve(data));
          }
          if (this.childProcess) {
            // send character to take the picture
            this.childProcess.stdin.write('-', err => {
              if (err) reject(err);
              if (this.options.output) {
                resolve(null);
              }
            });
          }
        });
      }
      return spawnPromise('raspistill', this.args);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(
          "Could not take image with StillCamera. Are you running on a Raspberry Pi with 'raspistill' installed?",
        );
      }
      this.emit('error', err);
      throw err;
    }
  }

  stopPreview(): void {
    if (!this.showPreview) return;

    this.showPreview = false;

    if (this.childProcess) {
      this.childProcess.removeAllListeners();
      this.childProcess.kill();
    }
  }
}

export default StillCamera;
