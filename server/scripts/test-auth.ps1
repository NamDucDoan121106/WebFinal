
$ErrorActionPreference = "Stop"
$base = "http://localhost:3000"
$script:passed = 0
$script:failed = 0

function Test-Result($name, $condition) {
    if ($condition) {
        Write-Host "[PASS] $name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "[FAIL] $name" -ForegroundColor Red
        $script:failed++
    }
}

function Test-HttpError($name, $expected, $action) {
    try {
        & $action | Out-Null
        Test-Result $name $false
    } catch {
        $response = $_.Exception.Response
        if ($null -eq $response) {
            Test-Result $name $false
            return
        }

        $status = [int]$response.StatusCode
        Test-Result "$name (HTTP $status)" ($status -eq $expected)
    }
}

Write-Host "`n===== AUTHENTICATION TEST SUITE ====="

# Test 1: Unauthenticated access
Test-HttpError "Unauthenticated access" 401 {
    Invoke-RestMethod "$base/api/auth/me"
}

# Enter a new, real email address
$email = Read-Host "Enter an unused email address"
$password = "Test!" + [guid]::NewGuid().ToString("N")

$registerBody = @{
    email = $email
    display_name = "Authentication Test"
    password = $password
    confirm_password = $password
} | ConvertTo-Json

# Test 2: Registration
$register = Invoke-RestMethod `
    -Uri "$base/api/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $registerBody `
    -SessionVariable session

Test-Result "Registration" ($register.success -eq $true)

Write-Host $register.message

# Test 3: Automatic login
$me = Invoke-RestMethod `
    -Uri "$base/api/auth/me" `
    -WebSession $session

Test-Result "Automatic login" ($me.success -eq $true)

# Test 4: Default preferences
$p = $me.data.preferences

Test-Result "Default preferences" (
    $p.view_mode -eq "grid" -and
    $p.theme -eq "light" -and
    $p.font_size -eq "md"
)

# Test 5: Unverified account
Test-Result "Unverified account" (
    $me.data.is_verified -eq $false
)

# Test 6: Sensitive fields not exposed
$fields = $me.data.PSObject.Properties.Name

Test-Result "Sensitive fields protected" (
    "password_hash" -notin $fields -and
    "verify_token" -notin $fields -and
    "token_version" -notin $fields
)

# Test 7: Duplicate email
Test-HttpError "Duplicate email" 409 {
    Invoke-RestMethod `
        -Uri "$base/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody
}

# Test 8: Wrong password
$wrongBody = @{
    email = $email
    password = "IncorrectPassword!"
} | ConvertTo-Json

Test-HttpError "Incorrect password" 401 {
    Invoke-RestMethod `
        -Uri "$base/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $wrongBody
}

# Test 9: Email activation
Write-Host "`nCheck your email for the activation link."

$token = Read-Host "Paste the activation token only, or press Enter to skip"

if ($token) {
    $verify = Invoke-RestMethod `
        -Uri "$base/api/auth/verify/$token"

    Test-Result "Email activation" (
        $verify.success -eq $true
    )

    $me = Invoke-RestMethod `
        -Uri "$base/api/auth/me" `
        -WebSession $session

    Test-Result "Verified account" (
        $me.data.is_verified -eq $true
    )

    Test-HttpError "Activation token reuse" 400 {
        Invoke-RestMethod "$base/api/auth/verify/$token"
    }
} else {
    Write-Host "[SKIP] 3 activation tests" -ForegroundColor Yellow
}

# Test 12: Logout
$logout = Invoke-RestMethod `
    -Uri "$base/api/auth/logout" `
    -Method Post `
    -WebSession $session

Test-Result "Logout" ($logout.success -eq $true)

# Test 13: Access after logout
Test-HttpError "Access after logout" 401 {
    Invoke-RestMethod `
        -Uri "$base/api/auth/me" `
        -WebSession $session
}

# Test 14: Login
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$login = Invoke-RestMethod `
    -Uri "$base/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $loginBody `
    -SessionVariable loginSession

Test-Result "Login" ($login.success -eq $true)

# Test 15: Authenticated access
$me = Invoke-RestMethod `
    -Uri "$base/api/auth/me" `
    -WebSession $loginSession

Test-Result "Authenticated access" (
    $me.success -eq $true
)

Write-Host "`n===== FINAL RESULT ====="
Write-Host "PASS: $script:passed / 15"
Write-Host "FAIL: $script:failed"
Write-Host "SKIP: $(15 - $script:passed - $script:failed)"
