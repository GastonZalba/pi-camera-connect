/// <reference types="node" />
import { EventEmitter } from 'events';
import { AwbMode, DynamicRange, ExposureMode, Flip, ImxfxMode, Rotation } from '..';
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
    colourEffect?: [number, number];
    dynamicRange?: DynamicRange;
    videoStabilisation?: boolean;
    raw?: boolean;
    quality?: number;
}
export default class StillCamera extends EventEmitter {
    private readonly options;
    static readonly jpegSignature: Buffer;
    private livePreview;
    private childProcess?;
    private streams;
    private args;
    constructor(options?: StillOptions);
    takeImage(): Promise<Buffer>;
    startPreview(preview: [number, number, number, number]): Promise<void>;
    stopPreview(): Promise<void>;
}
