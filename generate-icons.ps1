Add-Type -AssemblyName System.Drawing

$sourcePath = (Resolve-Path "icon.png").Path
$source = [System.Drawing.Bitmap]::FromFile($sourcePath)

Write-Host "Loaded master icon: $($source.Width)x$($source.Height)"

function Generate-IconFile {
    param(
        [System.Drawing.Bitmap]$src,
        [int]$width,
        [int]$height,
        [string]$destPath,
        [bool]$fillBackground = $false,
        [double]$paddingRatio = 0.05,
        [int]$bgR = 15,
        [int]$bgG = 23,
        [int]$bgB = 42
    )

    $targetBmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($targetBmp)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($fillBackground) {
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, $bgR, $bgG, $bgB))
        $g.FillRectangle($brush, 0, 0, $width, $height)
        $brush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    # The emblem in icon.png is located at X: 196..1060 (w=864), Y: 154..1050 (h=896)
    # We crop the emblem directly with its native aspect ratio
    $padX = [int]($width * $paddingRatio)
    $padY = [int]($height * $paddingRatio)
    $destW = $width - (2 * $padX)
    $destH = $height - (2 * $padY)
    
    $destRect = New-Object System.Drawing.Rectangle($padX, $padY, $destW, $destH)
    $srcRect = New-Object System.Drawing.Rectangle(185, 145, 885, 915)
    $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $g.Dispose()

    # Ensure parent dir exists
    $dir = [System.IO.Path]::GetDirectoryName($destPath)
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $targetBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $targetBmp.Dispose()
    Write-Host "Generated: $destPath ($($width)x$($height))"
}

# 1. iOS Apple Touch Icons (Opaque dark background #0f172a, crisp 180x180, 8% safe margin for squircle)
Generate-IconFile -src $source -width 180 -height 180 -destPath "public/apple-touch-icon.png" -fillBackground $true -paddingRatio 0.08
Generate-IconFile -src $source -width 180 -height 180 -destPath "public/apple-touch-icon-precomposed.png" -fillBackground $true -paddingRatio 0.08
Generate-IconFile -src $source -width 180 -height 180 -destPath "src/app/apple-icon.png" -fillBackground $true -paddingRatio 0.08

# 2. PWA Icons (192x192 and 512x512 with safe padding)
Generate-IconFile -src $source -width 192 -height 192 -destPath "public/icon-192.png" -fillBackground $true -paddingRatio 0.10
Generate-IconFile -src $source -width 512 -height 512 -destPath "public/icon-512.png" -fillBackground $true -paddingRatio 0.10

# 3. Favicon PNGs (Tightly cropped for tab visibility)
Generate-IconFile -src $source -width 32 -height 32 -destPath "public/favicon-32x32.png" -fillBackground $false -paddingRatio 0.02
Generate-IconFile -src $source -width 16 -height 16 -destPath "public/favicon-16x16.png" -fillBackground $false -paddingRatio 0.0
Generate-IconFile -src $source -width 48 -height 48 -destPath "public/favicon.png" -fillBackground $false -paddingRatio 0.02
Generate-IconFile -src $source -width 48 -height 48 -destPath "src/app/icon.png" -fillBackground $false -paddingRatio 0.02

# 4. Standard public/icon.png (high resolution 512x512 with cropped emblem)
Generate-IconFile -src $source -width 512 -height 512 -destPath "public/icon.png" -fillBackground $false -paddingRatio 0.02

# 5. Authentic ICO file (for legacy browsers and direct /favicon.ico queries)
$favBmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path "public/favicon-32x32.png").Path)
$hIcon = $favBmp.GetHicon()
$ico = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = [System.IO.File]::Create((Resolve-Path "public").Path + "\favicon.ico")
$ico.Save($fs)
$fs.Close()
$favBmp.Dispose()
Copy-Item "public/favicon.ico" "src/app/favicon.ico" -Force
Write-Host "Generated: public/favicon.ico and src/app/favicon.ico"

$source.Dispose()
Write-Host "All icon assets regenerated successfully!"
