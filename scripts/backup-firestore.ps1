# Exports the Firestore database to a timestamped folder in the backup bucket
# and verifies that the export completed. Run before any season rollover.
#
# Usage: .\scripts\backup-firestore.ps1 -Label pre-rollover

param(
  [string]$Project = 'exd-lab-663e5',
  [string]$Bucket = 'gs://exd-lab-663e5-backups',
  [string]$Label = 'manual'
)

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dest = "$Bucket/$Label/$stamp"

Write-Host "Exporting Firestore to $dest ..."
# gcloud writes progress to stderr, so check the exit code instead of letting PowerShell stop on it.
& gcloud.cmd firestore export $dest --project=$Project
if ($LASTEXITCODE -ne 0) {
  Write-Error "Export command failed (exit $LASTEXITCODE). Nothing was verified."
  exit 1
}

$operations = & gcloud.cmd firestore operations list --project=$Project --format=json | ConvertFrom-Json
$op = $operations | Where-Object { $_.metadata.outputUriPrefix -eq $dest } | Select-Object -First 1
if (-not $op -or -not $op.done -or $op.metadata.operationState -ne 'SUCCESSFUL') {
  $state = if ($op) { $op.metadata.operationState } else { 'not found' }
  Write-Error "Verification failed: export operation state is '$state'."
  exit 1
}

$metadata = & gcloud.cmd storage ls "$dest/*.overall_export_metadata" --project=$Project 2>$null
if (-not $metadata) {
  Write-Error "Verification failed: no overall_export_metadata file under $dest."
  exit 1
}

Write-Host "Backup verified: $dest"
exit 0
