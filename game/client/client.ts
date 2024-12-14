RegisterCommand("capture", (source: string) => {
    console.log("capture", source)
    /* console.log("Capture")
    SendNUIMessage({
        action: "capture",
        url: "https://www.uploadurl.com",
        serverEndpoint: `http://${GetCurrentServerEndpoint()}/${GetCurrentResourceName()}/upload`
    }) */
}, false)


onNet("screencapture:captureScreen", (token: string, options: Object, dataType: string) => {
    SendNUIMessage({
        uploadToken: token,
        ...options,
        dataType,
        action: "capture",
        serverEndpoint: `http://${GetCurrentServerEndpoint()}/${GetCurrentResourceName()}/upload`
    }) 
})