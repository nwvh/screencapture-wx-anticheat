import { TextDecoder } from "util";

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
            console.log("url path", req.path, "method", req.method)

            req.setDataHandler((data) => {
                console.log("typeof", typeof data)
                console.log("headers", req.headers)
                if (data instanceof ArrayBuffer) {
                    // Convert ArrayBuffer to a string
                    const decoder = new TextDecoder();
                    data = decoder.decode(data);

                    const contentType = req.headers['content-type'];
                    if (contentType === 'application/x-www-form-urlencoded') {
                        // Parse URL-encoded form data
                        const parsedData = data //querystring.parse(data);
                        console.log("Parsed form data:", parsedData);
                    }
                }
            })
        })
    }
}