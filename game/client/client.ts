onNet('screencapture:captureScreen', (token: string, options: object, dataType: string) => {
  SendNUIMessage({
    ...options,
    uploadToken: token,
    dataType,
    action: 'capture',
    serverEndpoint: `http://${GetCurrentServerEndpoint()}/${GetCurrentResourceName()}/image`,
  });
});


onNet("screencapture:captureStream", (token: string, options: object) => {
  SendNUIMessage({
    ...options,
    uploadToken: token,
    action: 'capture-stream-start',
    serverEndpoint: `http://${GetCurrentServerEndpoint()}/${GetCurrentResourceName()}/stream`,
  });
})

onNet("screencapture:INTERNAL:stopCaptureStream", () => {
  SendNUIMessage({
    action: 'capture-stream-stop',
  })
})