param(
    [string]$SourceDirectory = 'E:\Dasktop\AAAks'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectDirectory = Split-Path -Parent $PSScriptRoot
$iconDirectory = Join-Path $projectDirectory 'public\icons'
New-Item -ItemType Directory -Force -Path $iconDirectory | Out-Null

function New-Canvas([int]$size) {
    $bitmap = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bitmap.SetResolution(96, 96)
    return $bitmap
}

function Set-HighQualityGraphics([System.Drawing.Graphics]$graphics) {
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
}

function New-RoundedRectanglePath([System.Drawing.Rectangle]$rectangle, [int]$radius) {
    $diameter = $radius * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($rectangle.Left, $rectangle.Top, $diameter, $diameter, 180, 90)
    $path.AddArc($rectangle.Right - $diameter, $rectangle.Top, $diameter, $diameter, 270, 90)
    $path.AddArc($rectangle.Right - $diameter, $rectangle.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($rectangle.Left, $rectangle.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function Export-SquareIcon(
    [System.Drawing.Image]$source,
    [int]$size,
    [string]$fileName,
    [double]$contentScale = 1,
    [System.Drawing.Color]$background = [System.Drawing.Color]::Transparent,
    [bool]$clipRoundedCorners = $false
) {
    $canvas = New-Canvas $size
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    Set-HighQualityGraphics $graphics
    $graphics.Clear($background)

    $targetSize = [int][Math]::Round($size * $contentScale)
    $x = [int](($size - $targetSize) / 2)
    $y = $x
    $targetRectangle = New-Object System.Drawing.Rectangle $x, $y, $targetSize, $targetSize
    if ($clipRoundedCorners) {
        $clipPath = New-RoundedRectanglePath $targetRectangle ([int][Math]::Round($targetSize * 0.16))
        $graphics.SetClip($clipPath)
    }
    $graphics.DrawImage($source, $targetRectangle)
    if ($clipRoundedCorners) {
        $graphics.ResetClip()
        $clipPath.Dispose()
    }

    $outputPath = Join-Path $iconDirectory $fileName
    $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $canvas.Dispose()
}

$faviconSource = [System.Drawing.Image]::FromFile((Join-Path $SourceDirectory 'Favicon.png'))
$faviconSquareSize = [Math]::Min($faviconSource.Width, $faviconSource.Height)
$faviconCropX = [int](($faviconSource.Width - $faviconSquareSize) / 2)
$faviconCropY = [int](($faviconSource.Height - $faviconSquareSize) / 2)
$faviconMaster = New-Canvas $faviconSquareSize
$faviconGraphics = [System.Drawing.Graphics]::FromImage($faviconMaster)
Set-HighQualityGraphics $faviconGraphics
$faviconGraphics.Clear([System.Drawing.Color]::White)
$faviconGraphics.DrawImage(
    $faviconSource,
    (New-Object System.Drawing.Rectangle 0, 0, $faviconSquareSize, $faviconSquareSize),
    $faviconCropX,
    $faviconCropY,
    $faviconSquareSize,
    $faviconSquareSize,
    [System.Drawing.GraphicsUnit]::Pixel
)
$faviconGraphics.Dispose()

Export-SquareIcon $faviconMaster 32 'favicon-32.png'
Export-SquareIcon $faviconMaster 48 'favicon-48.png'
$faviconMaster.Dispose()
$faviconSource.Dispose()

$pwaSource = [System.Drawing.Image]::FromFile((Join-Path $SourceDirectory 'Pwa_logo.png'))
Export-SquareIcon $pwaSource 180 'apple-touch-icon.png' 1 ([System.Drawing.Color]::Transparent) $true
Export-SquareIcon $pwaSource 192 'pwa-192.png' 1 ([System.Drawing.Color]::Transparent) $true
Export-SquareIcon $pwaSource 512 'pwa-512.png' 1 ([System.Drawing.Color]::Transparent) $true
Export-SquareIcon $pwaSource 512 'pwa-maskable-512.png' 0.8 ([System.Drawing.Color]::FromArgb(255, 250, 240)) $true
$pwaSource.Dispose()

Get-ChildItem -LiteralPath $iconDirectory -File | Select-Object Name, Length
