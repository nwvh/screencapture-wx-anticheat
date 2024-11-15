import { Router } from './router';
import { CallbackData } from './export';
import './export';
import fs from 'fs';

const exp = global.exports as any;

export const router = new Router();

RegisterCommand(
  'capture',
  (_:string, args: string[]) => {
    const source = args[0];
    console.log('source', source);

    exp.screencapture.serverCapture(args[0], {}, (data: Pick<CallbackData, 'imageData'>) => {
      const matches = data.imageData.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 string');
      }

      const base64Data = matches[2];
      if (!base64Data) return console.log('ooops');

      const fileBuffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync('./thing.png', fileBuffer);
      console.log(`File saved`);
    });
  },
  false,
);