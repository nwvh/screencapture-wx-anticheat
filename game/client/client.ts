RegisterCommand("capture", () => {
    console.log("Capture")
    SendNUIMessage({
        action: "capture",
        url: "https://www.uploadurl.com",
        serverEndpoint: `https://${GetCurrentServerEndpoint()}/${GetCurrentResourceName()}/upload`
    })
}, false)