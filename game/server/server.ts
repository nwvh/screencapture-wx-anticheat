import { Router } from './router';
import './export';
import { eventController } from './event';
import { RequestUploadToken } from './types';

export const router = new Router();

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

    const token = router.addUpload({
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