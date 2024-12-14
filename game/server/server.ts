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
      (data: string | Buffer<ArrayBuffer>) => {
        fs.writeFileSync('./buffer_image.png', data);
        console.log(`File saved`);
      },
      {
        encoding: 'webp',
      },
      'base64',
    );
  },
  false,
);
