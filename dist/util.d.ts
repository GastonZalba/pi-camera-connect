/// <reference types="node" />
import { SpawnOptions } from 'child_process';
export declare const spawnPromise: (command: string, args?: string[] | undefined, options?: SpawnOptions | undefined) => Promise<Buffer>;
