import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http';
import * as stream from 'node:stream';

// dont even ask why
type DummySocket = {
  remoteAddress: string;
  remotePort: number;
};

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

export class Request extends stream.Readable {
  public method: string;
  public url: string;
  httpVersion: string = '1.1';
  httpVersionMajor: number = 1;
  httpVersionMinor: number = 1;
  connection: DummySocket;
  socket: DummySocket;
  rawTrailers: string[];
  trailers: NodeJS.Dict<string>;
  aborted: boolean;
  complete: boolean;
  headers: IncomingHttpHeaders;
  headersDistinct: NodeJS.Dict<string>;
  rawHeaders: string[];
  trailersDistinct: NodeJS.Dict<string[]>;
  setTimeout: (msecs: number, callback: () => void) => this;

  constructor(cfxReq: CfxRequest) {
    super();

    this.method = cfxReq.method;
    this.url = cfxReq.path;
    this.destroyed = false;
    this.aborted = false;
    this.complete = false;
    this.rawTrailers = [];
    this.headers = {};
    this.headersDistinct = {};
    this.trailers = {};
    this.rawHeaders = [];
    this.trailersDistinct = {}
    this.setTimeout = (ms: number, callback: () => void) => {
      global.setTimeout(callback, ms);
      return this;
  }

    try {
      let addrParts = cfxReq.address.split(':');
      if (addrParts.length != 2 || !addrParts[0]?.length || !addrParts[1]?.length) {
        throw new Error('Invalid IP:PORT');
      }

      this.connection = {
        remoteAddress: addrParts[0],
        remotePort: parseInt(addrParts[1]),
      };
    } catch (err) {
      if (err instanceof Error) {
        console.error(`requestHandler parsing ip:port error: ${err.message}`);
      }

      this.connection = {
        remoteAddress: '0.0.0.0',
        remotePort: 0,
      };
    }

    this.socket = this.connection;

    cfxReq.setDataHandler((data: string | ArrayBuffer | ArrayBufferView) => {
      if ((data as ArrayBuffer).byteLength !== undefined || ArrayBuffer.isView(data)) {
        this.push(Buffer.from(data as ArrayBuffer));
      } else {
        this.push(data, 'utf-8');
      }
    });
  }
}

export class Response extends stream.Writable {
  cfxRes: CfxResponse;
  finished = false;
  headersSent = false;
  statusCode = 200;
  statusMessage = 'OK';
  headers: Record<string, string | string[]> = {};
  socket: { remoteAddress: string; remotePort: number };

  constructor(cfxReq: CfxRequest, cfxRes: CfxResponse) {
    super();

    this.cfxRes = cfxRes;
    this.socket = {
      remoteAddress: cfxReq.address,
      remotePort: 0,
    };
  }

  setHeader(name: string, value: string | string[]): void {
    this.headers[name.toLowerCase()] = value;
  }

  writeHead(
    statusCode: number,
    reason?: string | Record<string, string | string[]>,
    headers?: Record<string, string | string[]>,
  ): void {
    if (this.headersSent) return;
    this.headersSent = true;

    this.statusCode = statusCode;
    if (typeof reason === 'string') {
      this.statusMessage = reason;
    } else {
      headers = reason;
    }

    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        this.setHeader(key, value);
      }
    }

    this.cfxRes.writeHead(this.statusCode, this.headers);
  }

  _write(chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    if (!this.headersSent) {
      this.writeHead(this.statusCode);
    }

    this.cfxRes.write(chunk.toString());
    callback();
  }

  end(chunk?: unknown, encoding?: unknown, cb?: unknown): this {
    if (this.finished) {
      return this;
    }

    if (typeof chunk === 'function') {
      cb = chunk;
      chunk = null;
    } else if (typeof encoding === 'function') {
      cb = encoding;
      encoding = null;
    }

    if (chunk) {
      this.write(chunk, encoding as BufferEncoding);
    }

    this.cfxRes.send();

    if (typeof cb === 'function') {
      cb();
    }

    this.finished = true;
    return this;
  }
}

export const setHttpCallback = (requestHandler: (req: IncomingMessage, res: ServerResponse) => void) => {
  globalThis.SetHttpHandler((req: CfxRequest, res: CfxResponse) => {
    // again, don't ask, just accept it
    requestHandler(new Request(req) as unknown as IncomingMessage, new Response(req, res) as unknown as ServerResponse);
  });
};