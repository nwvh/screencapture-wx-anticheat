RegisterCommand("capture", function ()
    print("Capture")
    SendNUIMessage({
        action = "capture",
        url = "https://www.uploadurl.com",
    })
end, false)