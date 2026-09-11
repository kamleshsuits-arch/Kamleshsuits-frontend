param(
    [string]$SourceDirectory,
    [string]$PwaSourcePath,
    [string]$NotificationSourcePath,
    [switch]$PwaOnly,
    [switch]$CircularFavicon
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectDirectory = Split-Path -Parent $PSScriptRoot
$iconDirectory = Join-Path $projectDirectory 'public\icons'
New-Item -ItemType Directory -Force -Path $iconDirectory | Out-Null

if (-not $SourceDirectory) { $SourceDirectory = Join-Path $projectDirectory 'public\images' }
if (-not $PwaSourcePath) { $PwaSourcePath = Join-Path $SourceDirectory 'Kamlesh_logo.png' }
if (-not $NotificationSourcePath) { $NotificationSourcePath = Join-Path $SourceDirectory 'notification-monogram-source.png' }

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
    [bool]$clipRoundedCorners = $false,
    [bool]$clipCircle = $false
) {
    $canvas = New-Canvas $size
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    Set-HighQualityGraphics $graphics
    $graphics.Clear($background)

    $targetSize = [int][Math]::Round($size * $contentScale)
    $x = [int](($size - $targetSize) / 2)
    $y = $x
    $targetRectangle = New-Object System.Drawing.Rectangle $x, $y, $targetSize, $targetSize
    if ($clipCircle) {
        $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $clipPath.AddEllipse($targetRectangle)
        $graphics.SetClip($clipPath)
    } elseif ($clipRoundedCorners) {
        $clipPath = New-RoundedRectanglePath $targetRectangle ([int][Math]::Round($targetSize * 0.16))
        $graphics.SetClip($clipPath)
    }
    $graphics.DrawImage($source, $targetRectangle)
    if ($clipRoundedCorners -or $clipCircle) {
        $graphics.ResetClip()
        $clipPath.Dispose()
    }

    $outputPath = Join-Path $iconDirectory $fileName
    $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $canvas.Dispose()
}

if (-not $PwaOnly) {
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
}

$pwaSource = [System.Drawing.Image]::FromFile($PwaSourcePath)
# Standard install icons match the circular favicon: the artwork reaches the
# edge and the area outside the mark stays transparent instead of turning white.
Export-SquareIcon $pwaSource 180 'apple-touch-icon.png' 1 ([System.Drawing.Color]::Transparent) $false $true
Export-SquareIcon $pwaSource 192 'pwa-192.png' 1 ([System.Drawing.Color]::Transparent) $false $true
Export-SquareIcon $pwaSource 512 'pwa-512.png' 1 ([System.Drawing.Color]::Transparent) $false $true

# Maskable icons must cover the complete launcher tile. Use the brand maroon
# beneath the full-size logo so Android never adds a white ring around it.
$maskableBackground = [System.Drawing.Color]::FromArgb(255, 92, 15, 15)
Export-SquareIcon $pwaSource 512 'pwa-maskable-512.png' 1 $maskableBackground $false $true
if ($CircularFavicon) {
    Export-SquareIcon $pwaSource 32 'favicon-32.png' 1 ([System.Drawing.Color]::Transparent) $false $true
    Export-SquareIcon $pwaSource 48 'favicon-48.png' 1 ([System.Drawing.Color]::Transparent) $false $true
}
$pwaSource.Dispose()

# Android/Web Push status-bar badges are alpha masks. Reduce the generated
# monogram to a single white silhouette so the OS can tint it correctly.
if (Test-Path -LiteralPath $NotificationSourcePath) {
    $notificationSource = [System.Drawing.Bitmap]::FromFile($NotificationSourcePath)
    $notificationMask = New-Canvas $notificationSource.Width
    for ($y = 0; $y -lt $notificationSource.Height; $y++) {
        for ($x = 0; $x -lt $notificationSource.Width; $x++) {
            $pixel = $notificationSource.GetPixel($x, $y)
            $brightness = [Math]::Min($pixel.R, [Math]::Min($pixel.G, $pixel.B))
            if ($brightness -ge 245) {
                $notificationMask.SetPixel($x, $y, [System.Drawing.Color]::White)
            }
        }
    }
    Export-SquareIcon $notificationMask 96 'notification-badge-96.png'
    $notificationMask.Dispose()
    $notificationSource.Dispose()
}

Get-ChildItem -LiteralPath $iconDirectory -File | Select-Object Name, Length
