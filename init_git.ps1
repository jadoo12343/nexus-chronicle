$gitDir = "$env:LOCALAPPDATA\Programs\Git"
if (-not (Test-Path $gitDir)) {
    New-Item -ItemType Directory -Path $gitDir -Force | Out-Null
}

$gitExe = "$gitDir\cmd\git.exe"
if (-not (Test-Path $gitExe)) {
    $zipPath = "$env:TEMP\mingit.zip"
    $url = "https://github.com/git-for-windows/git/releases/download/v2.48.1.windows.1/MinGit-2.48.1-64-bit.zip"
    Write-Output "Downloading MinGit..."
    Invoke-WebRequest -Uri $url -OutFile $zipPath
    Write-Output "Extracting MinGit to $gitDir..."
    Expand-Archive -Path $zipPath -DestinationPath $gitDir -Force
    Remove-Item $zipPath -Force
}

Write-Output "Git installed at: $gitExe"

# Add Git to User PATH permanently
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$gitDir\cmd*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$userPath;$gitDir\cmd;$gitDir\bin", "User")
}

# Run Git Init and Commit
$projectDir = "C:\Users\Nirvan\Desktop\files"
Set-Location $projectDir

& $gitExe config --global user.name "Nirvan"
& $gitExe config --global user.email "nirvan@example.com"
& $gitExe init
& $gitExe add .
& $gitExe commit -m "Initial commit: Nexus Chronicle 2.0 Cinematic Visual RPG"

Write-Output "SUCCESS: Git repository initialized and committed!"
