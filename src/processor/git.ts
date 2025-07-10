import { spawn } from 'cross-spawn';

export async function getStagedFiles(): Promise<string[]> {
  const result = spawn('git', ['diff', '--cached', '--name-only'], {
    stdio: 'pipe',
  });

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];

    result.stdout?.on('data', (data: Buffer) => {
      chunks.push(data);
    });

    result.stderr?.on('data', (data: Buffer) => {
      errorChunks.push(data);
    });

    result.on('error', (error) => {
      reject(error);
    });

    result.on('exit', (code) => {
      if (code === 0) {
        const stdout = Buffer.concat(chunks).toString();
        const files = stdout
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        resolve(files);
      } else {
        const stderr = Buffer.concat(errorChunks).toString();
        reject(new Error(`Git command failed: ${stderr}`));
      }
    });
  });
}


