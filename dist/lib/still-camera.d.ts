/// <reference types="node" />
import { EventEmitter } from 'events';
import { AwbMode, DisplayNumber, DynamicRange, ExposureMode, FlickerMode, Flip, ImageEffectMode, StillLibrary, MeteringMode, Rotation, DenoiseMode } from '..';
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
    raw?: boolean;
    quality?: number;
    statistics?: boolean;
    thumbnail?: [number, number, number] | false;
    meteringMode?: MeteringMode;
    roi?: [number, number, number, number];
    showPreview?: [number, number, number, number] | 'fullscreen' | false;
    displayNumber?: DisplayNumber;
    exif?: {
        [key: string]: string | number;
    } | false;
    gpsExif?: boolean;
    output?: string;
    frameStart?: number;
    latest?: string;
    /**
     * Only for libcamera
     */
    gain?: number;
    denoiseMode?: DenoiseMode;
    /**
     * Only for stillcamera
     */
    colorEffect?: [number, number];
    imageEffectMode?: ImageEffectMode;
    iso?: number;
    analogGain?: number;
    digitalGain?: number;
    videoStabilization?: boolean;
    burst?: boolean;
    flickerMode?: FlickerMode;
    annotate?: (number | string)[];
    annotateExtra?: [number, string, string];
    opacityPreview?: number;
    dynamicRange?: DynamicRange;
}
declare interface StillCamera {
    on(event: 'frame', listener: (image: Buffer) => void): this;
    once(event: 'frame', listener: (image: Buffer) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    once(event: 'error', listener: (error: Error) => void): this;
}
declare class StillCamera extends EventEmitter {
    private options;
    private readonly defaultOptions;
    static readonly jpegSignature: Buffer;
    static readonly jpegSignatureEnd: Buffer;
    private showPreview;
    private childProcess?;
    private args;
    private readonly libraryMode;
    constructor(options?: StillOptions);
    setOptions(options: StillOptions): void;
    private initChildProcess;
    private startPreview;
    takeImage(): Promise<Buffer | null>;
    stopPreview(): void;
}
export default StillCamera;
