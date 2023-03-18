/// <reference types="node" />
import { EventEmitter } from 'events';
import { AwbMode, DisplayNumber, DynamicRange, ExposureMode, FlickerMode, Flip, ImageEffectMode, MeteringMode, Rotation } from '..';
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
    colorEffect?: [number, number];
    dynamicRange?: DynamicRange;
    videoStabilization?: boolean;
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
    constructor(options?: StillOptions);
    setOptions(options: StillOptions): void;
    private startPreview;
    takeImage(): Promise<Buffer | null>;
    stopPreview(): void;
}
export default StillCamera;
