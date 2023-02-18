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
export default class StillCamera extends EventEmitter {
    private readonly options;
    static readonly jpegSignature: Buffer;
    livePreview: boolean;
    private childProcess?;
    private streams;
    private readonly args;
    constructor(options?: StillOptions);
    takeImage(): Promise<Buffer>;
    private startPreview;
    stopPreview(): Promise<void>;
}
