import { spawn, SpawnOptions } from 'child_process';

/**
 * Count all occurrences of a indexOf
 * @param buffer
 * @param searchItem
 * @returns
 */
export const indexOfAll = (buffer: Buffer, searchItem: Buffer) => {
  let i = buffer.indexOf(searchItem);
  let count = 0;
  while (i !== -1) {
    count += 1;
    i += 1;
    i = buffer.indexOf(searchItem, i);
  }
  return count;
};

export const spawnPromise = (command: string, args?: Array<string>, options?: SpawnOptions) =>
  new Promise<Buffer>((resolve, reject) => {
    const childProcess = spawn(command, args ?? [], options ?? {});

    let stdoutData = Buffer.alloc(0);
    let stderrData = Buffer.alloc(0);

    if (!childProcess.stdout) {
      throw new Error(`No 'stdout' available on spawned process '${command}'`);
    }

    if (!childProcess.stderr) {
      throw new Error(`No 'stderr' available on spawned process '${command}'`);
    }

    childProcess.once('error', (err: Error) => reject(err));

    childProcess.stdout.on(
      'data',
      (data: Buffer) => (stdoutData = Buffer.concat([stdoutData, data])),
    );
    childProcess.stdout.once('error', (err: Error) => reject(err));

    childProcess.stderr.on(
      'data',
      (data: Buffer) => (stderrData = Buffer.concat([stderrData, data])),
    );
    childProcess.stderr.once('error', (err: Error) => reject(err));

    childProcess.stdout.on('close', () => {
      if (stderrData.length > 0) return reject(new Error(stderrData.toString()));

      return resolve(stdoutData);
    });
  });
