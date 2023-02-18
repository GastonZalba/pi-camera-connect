/// <reference types="node" />
import { EventEmitter } from 'events';
import { AwbMode, DisplayNumber, DynamicRange, ExposureMode, FlickerMode, Flip, ImxfxMode, MeteringMode, Rotation } from '..';
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
    imageEffect?: ImxfxMode;
    colourEffect?: [number, number];
    dynamicRange?: DynamicRange;
    videoStabilisation?: boolean;
    raw?: boolean;
    quality?: number;
    statistics?: boolean;
    thumbnail?: [number, number, number] | 'none';
    meteringMode?: MeteringMode;
    flickerMode?: FlickerMode;
    burst?: boolean;
    roi?: [number, number, number, number];
    showPreview?: [number, number, number, number] | 'fullscreen' | false;
    opacityPreview?: number;
    displayNumber?: DisplayNumber;
}
declare interface StillCamera {
    on(event: 'frame', listener: (image: Buffer) => void): this;
    once(event: 'frame', listener: (image: Buffer) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    once(event: 'error', listener: (error: Error) => void): this;
}
declare class StillCamera extends EventEmitter {
    private options;
    static readonly jpegSignature: Buffer;
    livePreview: boolean;
    private childProcess?;
    private streams;
    private args;
    constructor(options?: StillOptions);
    private init;
    private startPreview;
    takeImage(): Promise<Buffer>;
    updateOptions(options: StillOptions): void;
    stopPreview(): void;
}
export default StillCamera;
