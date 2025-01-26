import { Router } from './router';
import './export';
import { eventController } from './event';

eventController("screencapture:INTERNAL_requestUploadToken", async ({ ctx, body }) => {

})

export const router = new Router();