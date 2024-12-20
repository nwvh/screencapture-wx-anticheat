import { Router } from './router';
import './export';
import fs from 'fs';

const exp = global.exports as any;

export const router = new Router();

RegisterCommand(
  'capture',
  (_: string, args: string[]) => {
    exp.screencapture.serverCapture(
      args[0],
      { encoding: 'webp' },
      (data: string | Buffer<ArrayBuffer>) => {
        data = Buffer.from(data as ArrayBuffer);

        fs.writeFileSync('./blob_image.webp', data);
        console.log(`File saved`);
      },
      'blob',
    );
  },
  false,
);

RegisterCommand("remoteCapture", (_: string, args: string[]) => {
  exp.screencapture.remoteUpload(args[0], "https://api.fivemanage.com/api/image", {
    encoding: "webp",
    headers: {
      "Authorization": "",
    }
  }, (data: any) => {
    console.log(data);
  }, "blob")
}, false);