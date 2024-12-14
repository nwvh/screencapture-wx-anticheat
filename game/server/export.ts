import { router } from "./server";

type CaptureOptions = {
    headers?: HeadersInit;
    field?: string;
    filename?: string;
    encoding?: string;
}

export type CallbackData = {
    imageData: string | Buffer<ArrayBuffer>
    dataType: string;
}

export type CallbackFn = (data: any) => void;

global.exports("serverRemoteUpload", () => {
})

global.exports("serverCapture", (source: number, callback: CallbackFn, options: CaptureOptions, dataType = "base64") => {
    const token = router.addUpload(callback)
    emitNet("screencapture:captureScreen", source, token, options, dataType)
})