Add-Type -AssemblyName System.Drawing
$targetDir = Join-Path $PSScriptRoot "..\extensions\homies-ipos-bridge\icons"
[System.IO.Directory]::CreateDirectory($targetDir) | Out-Null

$sizes = @(16, 48, 128)
foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # Background circle - Navy #001D3D
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 29, 61))
    $g.FillEllipse($bgBrush, 0, 0, $size, $size)

    # Letter 'H' - Gold #FFC300
    $fontSize = [Math]::Max(7, [float]($size * 0.5))
    $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 195, 0))

    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $g.DrawString('H', $font, $textBrush, $rect, $sf)

    $destPath = Join-Path $targetDir "icon-$size.png"
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created $destPath"
}
