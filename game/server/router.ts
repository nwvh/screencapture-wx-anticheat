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

export class Router {
  constructor() {
    global.SetHttpHandler((req: CfxRequest, res: CfxResponse) => {
      console.log('url path', req.path, 'method', req.method);

      req.setDataHandler((data) => {
        console.log('typeof', typeof data);
        console.log('headers', req.headers);

        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*"
        });
        res.write(JSON.stringify({ status: "ok" }));
        res.send(); // Ensure the response is closed
      });
    });
  }
}
