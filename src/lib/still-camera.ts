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
  StillLibrary,
  MeteringMode,
  Rotation,
} from '..';
import { indexOfAll, spawnPromise } from '../util';
import { getSharedArgs } from './shared-args';

export interface StillOptions {
  libraryMode?: StillLibrary;
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
  exposureCompensation?: number;
  exposureMode?: ExposureMode;
  awbMode?: AwbMode;
  awbGains?: [number, number];

  /**
   * Only for stillcamera
   */
  iso?: number;

  /**
   * Only for stillcamera
   */
  analogGain?: number;

  /**
   * Only for stillcamera
   */
  digitalGain?: number;

  /**
   * Only for libcamera
   */
  gain?: number;

  /**
   * Only for stillcamera
   */
  imageEffectMode?: ImageEffectMode;

  /**
   * Only for stillcamera
   */
  colorEffect?: [number, number]; // U,V

  /**
   * Only for stillcamera
   */
  videoStabilization?: boolean;

  dynamicRange?: DynamicRange;
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
  latest?: string;
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

  static readonly jpegSignature = Buffer.from([0xff, 0xd8]);
  static readonly jpegSignatureEnd = Buffer.from([0xff, 0xd9]);

  private showPreview: boolean = false;
  private childProcess?: ChildProcessWithoutNullStreams;
  private args: Array<string> = [];
  private readonly libraryMode: StillLibrary;

  constructor(options: StillOptions = {}) {
    super();

    // defaults
    this.defaultOptions = {
      rotation: Rotation.Rotate0,
      flip: Flip.None,
      delay: 1,
    };

    this.libraryMode = options.libraryMode ?? StillLibrary.Raspistill;

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
  private initChildProcess(): ChildProcessWithoutNullStreams {
    // Spawn child process
    const childProcess = spawn(this.libraryMode, this.args);

    childProcess.on('error', () => {
      this.emit(
        'error',
        new Error(
          `Could not initialize StillCamera. Are you running on a Raspberry Pi with '${this.libraryMode}' installed?`,
        ),
      );
    });

    // Listen for error events
    childProcess.stdout.on('error', err => this.emit('error', err));
    childProcess.stderr.on('data', data => this.emit('error', new Error(data.toString())));
    childProcess.stderr.on('error', err => this.emit('error', err));

    // Listen for close events
    childProcess.stdout.once('close', () => {
      this.stopPreview();
      this.emit('close');
    });

    return childProcess;
  }

  private startPreview(): Promise<void> {
    return new Promise(resolve => {
      try {
        if (!this.childProcess) {
          this.childProcess = this.initChildProcess();
        }

        // Wait for first data event to resolve promise
        this.childProcess.stdout.once('data', () => resolve());

        let stdoutBuffer = Buffer.alloc(0);

        // Embebed thumnbail support
        let countEnd = 0;
        let countStart = 0;

        // Listen for image data events and parse MJPEG frames if codec is MJPEG
        this.childProcess.stdout.on('data', (data: Buffer) => {
          stdoutBuffer = Buffer.concat([stdoutBuffer, data]);

          // Count the JPEG starts and ends of JPEG signatures
          // If the image has embebed preview, the start index match two times
          countStart += indexOfAll(data, StillCamera.jpegSignature);
          countEnd += indexOfAll(data, StillCamera.jpegSignatureEnd);

          // Extract all image frames from the current buffer
          while (true) {
            const signatureIndex = stdoutBuffer.indexOf(StillCamera.jpegSignature);

            if (signatureIndex === -1) break;

            // Make sure the signature starts at the beginning of the buffer
            if (signatureIndex > 0) stdoutBuffer = stdoutBuffer.slice(signatureIndex);

            if (countEnd !== countStart) break;

            this.emit('frame', stdoutBuffer);

            countEnd = 0;
            countStart = 0;
            stdoutBuffer = Buffer.alloc(0);
            break;
          }
        });

        this.showPreview = true;
      } catch (err) {
        this.stopPreview();
        this.emit('error', err);
        resolve();
      }
    });
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
      return spawnPromise(this.libraryMode, this.args);
    } catch (err) {
      const error =
        (err as NodeJS.ErrnoException).code === 'ENOENT'
          ? new Error(
              `Could not take image with StillCamera. Are you running on a Raspberry Pi with ${this.libraryMode} installed?`,
            )
          : err;

      this.emit('error', error);
      throw error;
    }
  }

  stopPreview(): void {
    if (!this.showPreview) return;

    this.showPreview = false;

    if (this.childProcess) {
      this.childProcess.stdout.removeAllListeners();
      this.childProcess.kill();
      this.childProcess = undefined;
    }
  }
}

export default StillCamera;
