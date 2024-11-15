import { router } from "./server";

type CaptureOptions = {
    headers?: HeadersInit;
    field?: string;
    filename?: string;
    encoding?: string;
}

export type CallbackData = {
    uploadToken: string;
    imageData: string;
}

export type CallbackFn = (data: Pick<CallbackData, 'imageData'>) => void;

global.exports("serverRemoteUpload", () => {

})

global.exports("serverCapture", (source: number, options: CaptureOptions, callback: CallbackFn) => {
    console.log(source, options)

    const token = router.addUpload(callback)
    emitNet("screencapture:captureScreen", source, token, options)
})