import { createServer } from './koa-router';
import './export';
import { eventController } from './event';
import { RequestUploadToken } from './types';
import { UploadStore } from './upload-store';

export const uploadStore = new UploadStore();

async function boot() {
  createServer(uploadStore);
}

boot();

eventController<RequestUploadToken, string>(
  'screencapture:INTERNAL_requestUploadToken',
  async ({ ctx, body, send }) => {
    function uploadCallback(
      response: unknown,
      playerSource: number | undefined,
      correlationId: string | undefined,
    ): void {
      emitNet('screencapture:INTERNAL_uploadComplete', playerSource, JSON.stringify(response), correlationId);
    }

    const token = uploadStore.addUpload({
      callback: uploadCallback,
      isRemote: true,
      remoteConfig: {
        filename: body ? body.filename : undefined,
        encoding: body.encoding,
        headers: body.headers,
        formField: 'file',
      },
      url: body.url,
      dataType: 'blob',
      playerSource: ctx.source,
      correlationId: body.correlationId,
    });

    return send(token);
  },
);
