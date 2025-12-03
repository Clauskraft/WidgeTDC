# Setup Script 04: Download Datasets (Zenodo10K)
# Downloader Zenodo10K PPT dataset fra Hugging Face

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Step 4: Download Datasets" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$datasetPath = "C:\Users\claus\Projects\WidgeTDC\training-data"

# Create dataset directory
if(-not (Test-Path $datasetPath)) {
    Write-Host "Creating dataset directory..." -ForegroundColor Yellow
    New-Item -Path $datasetPath -ItemType Directory -Force
}

cd $datasetPath

# Check if Git LFS is installed
try {
    git lfs version | Out-Null
    Write-Host "✅ Git LFS is installed" -ForegroundColor Green
}
catch {
    Write-Host "Installing Git LFS..." -ForegroundColor Yellow
    git lfs install
}

# Clone Zenodo10K dataset
if(-not (Test-Path "$datasetPath\Zenodo10K")) {
    Write-Host "Downloading Zenodo10K dataset (this may take a while)..." -ForegroundColor Yellow
    Write-Host "Dataset size: ~10GB with 10,000+ PPT files" -ForegroundColor Cyan
    
    git lfs clone https://huggingface.co/datasets/Forceless/Zenodo10K
    
    Write-Host "✅ Zenodo10K downloaded!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Zenodo10K already exists. Skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Dataset download complete!" -ForegroundColor Green
Write-Host "Location: $datasetPath\Zenodo10K" -ForegroundColor Cyan
Write-Host ""
