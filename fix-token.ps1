# Script to remove token from git history
$content = Get-Content "backend/test-github-models.js" -Raw
$content = $content -replace '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', 'process.env.GITHUB_TOKEN'
Set-Content "backend/test-github-models.js" -Value $content -NoNewline

