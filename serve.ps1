$port = 8000
$dir = 'C:\Users\bentm\Desktop\Claude\CuteBoy\cuteboy inventory management'
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server running on http://localhost:$port"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $path = $request.RawUrl.TrimStart('/')
        if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }
        $filepath = Join-Path $dir $path

        if (Test-Path $filepath) {
            $content = [System.IO.File]::ReadAllBytes($filepath)
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.OutputStream.Close()
    } catch { Write-Host "Error: $_" }
}
