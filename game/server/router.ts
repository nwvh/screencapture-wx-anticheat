import { CallbackData, CallbackFn } from './export';
import { nanoid } from 'nanoid';

type CfxRequest = {
  address: string;
  headers: Record<string, string>;
  method: string;
  path: string;
  setDataHandler(handler: (data: string) => void): void;
  setDataHandler(handler: (data: ArrayBuffer) => void, binary: 'binary'): void;
};

type CfxResponse = {
  writeHead(code: number, headers?: Record<string, string | string[]>): void;
  write(data: string): void;
  send(data?: string): void;
};

type UploadData = {
  callback: CallbackFn;
};

export class Router {
  #uploadMap: Map<string, UploadData>;

  constructor() {
    this.#uploadMap = new Map<string, UploadData>();

    global.SetHttpHandler((req: CfxRequest, res: CfxResponse) => {
      console.log('url path', req.path, 'method', req.method);

      req.setDataHandler((data) => {
        const body = JSON.parse(data) as CallbackData;
        const token = req.headers["X-ScreenCapture-Token"] as string;

        try {
          const cb = this.getUpload(token);
          cb({
            imageData: body.imageData,
          });
        } catch (err) {
          if (err instanceof Error) {
            console.error(err.message);
            res.writeHead(500);
            res.write(JSON.stringify({ status: 'error', message: err.message }));
            return res.send();
          }
        }

        res.writeHead(200);
        res.write(JSON.stringify({ status: 'ok' }));
        res.send();
      });
    });
  }

  addUpload(callback: CallbackFn): string {
    const uploadToken = nanoid(24);

    this.#uploadMap.set(uploadToken, {
      callback,
    });

    return uploadToken;
  }

  getUpload(uploadToken: string): CallbackFn {
    console.log(this.#uploadMap.keys)

    const exists = this.#uploadMap.has(uploadToken);
    if (!exists) {
      throw new Error('Upload data does not exist. Cancelling screen capture.');
    }

    const data = this.#uploadMap.get(uploadToken);
    if (!data) throw new Error('Could not find upload data');

    return data.callback;
  }
}
