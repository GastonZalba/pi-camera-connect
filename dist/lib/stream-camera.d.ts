/// <reference types="node" />
import { EventEmitter } from 'events';
import * as stream from 'stream';
import { AwbMode, DynamicRange, ExposureMode, Flip, ImxfxMode, Rotation } from '..';
export declare enum Codec {
    H264 = "H264",
    MJPEG = "MJPEG"
}
export declare enum SensorMode {
    AutoSelect = 0,
    Mode1 = 1,
    Mode2 = 2,
    Mode3 = 3,
    Mode4 = 4,
    Mode5 = 5,
    Mode6 = 6,
    Mode7 = 7
}
export interface StreamOptions {
    width?: number;
    height?: number;
    rotation?: Rotation;
    flip?: Flip;
    bitRate?: number;
    fps?: number;
    codec?: Codec;
    sensorMode?: SensorMode;
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
    showPreview?: [number, number, number, number];
    fullscreen?: boolean;
}
declare interface StreamCamera {
    on(event: 'frame', listener: (image: Buffer) => void): this;
    once(event: 'frame', listener: (image: Buffer) => void): this;
}
declare class StreamCamera extends EventEmitter {
    private readonly options;
    private childProcess?;
    private streams;
    private readonly livePreview;
    static readonly jpegSignature: Buffer;
    constructor(options?: StreamOptions);
    startCapture(): Promise<void>;
    stopCapture(): Promise<void>;
    createStream(): stream.Readable;
    takeImage(): Promise<Buffer>;
}
export default StreamCamera;
