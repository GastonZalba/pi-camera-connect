/// <reference types="node" />
import { EventEmitter } from 'events';
import { AwbMode, DisplayNumber, DynamicRange, ExposureMode, FlickerMode, Flip, ImageEffectMode, StillLibrary, MeteringMode, Rotation } from '..';
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
    colorEffect?: [number, number];
    /**
     * Only for stillcamera
     */
    videoStabilization?: boolean;
    dynamicRange?: DynamicRange;
    raw?: boolean;
    quality?: number;
    statistics?: boolean;
    thumbnail?: [number, number, number] | false;
    meteringMode?: MeteringMode;
    flickerMode?: FlickerMode;
    burst?: boolean;
    roi?: [number, number, number, number];
    showPreview?: [number, number, number, number] | 'fullscreen' | false;
    opacityPreview?: number;
    displayNumber?: DisplayNumber;
    exif?: {
        [key: string]: string | number;
    } | false;
    gpsExif?: boolean;
    annotate?: (number | string)[];
    annotateExtra?: [number, string, string];
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
