param(
  [string]$BaseUrl = 'http://localhost:3000/api'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
$script:CreatedProductIds = @()

function Assert-True([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw "ASSERT: $Message" }
}

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    [string]$Token = '',
    $Body = $null
  )
  $headers = @{}
  if ($Token) { $headers.Authorization = "Bearer $Token" }
  $args = @{
    Method = $Method
    Uri = "$BaseUrl$Path"
    Headers = $headers
  }
  if ($null -ne $Body) {
    $args.ContentType = 'application/json'
    $args.Body = $Body | ConvertTo-Json -Depth 12
  }
  $response = Invoke-RestMethod @args
  if ($response.PSObject.Properties.Name -contains 'success') {
    Assert-True $response.success "Respons $Method $Path tidak sukses"
  }
  return $response.data
}

function Send-Image {
  param(
    [string]$Path,
    [string]$Token,
    [byte[]]$Bytes,
    [string]$Filename,
    [string]$Mime
  )
  $client = [System.Net.Http.HttpClient]::new()
  try {
    $client.DefaultRequestHeaders.Authorization =
      [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $Token)
    $multipart = [System.Net.Http.MultipartFormDataContent]::new()
    $content = [System.Net.Http.ByteArrayContent]::new($Bytes)
    $content.Headers.ContentType =
      [System.Net.Http.Headers.MediaTypeHeaderValue]::new($Mime)
    $multipart.Add($content, 'file', $Filename)
    $response = $client.PostAsync("$BaseUrl$Path", $multipart).GetAwaiter().GetResult()
    $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) {
      throw "Upload $Path gagal ($([int]$response.StatusCode)): $text"
    }
    return ($text | ConvertFrom-Json).data
  } finally {
    $client.Dispose()
  }
}

function New-Product {
  param(
    [string]$Token,
    [string]$CategoryId,
    [string]$Name,
    [string]$StockType,
    [int]$StockQty,
    [int]$PoDays = 0
  )
  $body = @{
    categoryId = $CategoryId
    name = $Name
    description = 'Produk otomatis untuk pengujian alur nyata. Aman dihapus.'
    basePrice = 150000
    stockType = $StockType
    stockQty = $StockQty
  }
  if ($PoDays -gt 0) { $body.poDays = $PoDays }
  $product = Invoke-Api POST '/admin/products' $Token $body
  $script:CreatedProductIds += $product.id
  return $product
}

$adminLogin = Invoke-Api POST '/admin/auth/login' '' @{
  email = 'owner@seliflorist.com'
  password = 'PasswordKuat123!'
}
$customerLogin = Invoke-Api POST '/auth/login' '' @{
  email = 'budi.santoso@gmail.com'
  password = 'PasswordKuat123!'
}
$adminToken = $adminLogin.accessToken
$customerToken = $customerLogin.accessToken
Write-Host 'Tahap autentikasi lulus'

$categories = Invoke-Api GET '/categories'
$flowerCategory = $categories | Where-Object slug -eq 'bunga' | Select-Object -First 1
$rentalCategory = $categories | Where-Object slug -eq 'papan_ucapan' | Select-Object -First 1
Assert-True ($null -ne $flowerCategory) 'Kategori bunga tidak tersedia'
Assert-True ($null -ne $rentalCategory) 'Kategori papan ucapan tidak tersedia'

$suffix = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$ready = New-Product $adminToken $flowerCategory.id "QA Buket Cepat $suffix" 'READY_STOCK' 20
$duplicate = New-Product $adminToken $flowerCategory.id "QA Buket Cepat $suffix" 'READY_STOCK' 5
$preorder = New-Product $adminToken $flowerCategory.id "QA Preorder $suffix" 'PRE_ORDER' 0 3
$rental = New-Product $adminToken $rentalCategory.id "QA Papan Sewa $suffix" 'RENTAL_UNIT' 0
Assert-True ($ready.slug -ne $duplicate.slug) 'Slug produk duplikat tidak dibuat unik'
Write-Host 'Tahap pembuatan katalog lulus'

$jpg = [byte[]]@(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9)
$webp = [System.Text.Encoding]::ASCII.GetBytes('RIFF0000WEBPVP8 0000')
$png = [byte[]]::new(5 * 1024 * 1024)
$pngStart = [byte[]]@(137, 80, 78, 71, 13, 10, 26, 10)
$pngEnd = [byte[]]@(73, 69, 78, 68, 174, 66, 96, 130)
$pngStart.CopyTo($png, 0)
$pngEnd.CopyTo($png, $png.Length - 8)

$jpgImage = Send-Image "/admin/products/$($ready.id)/images" $adminToken $jpg 'foto-uji.jpg' 'image/jpeg'
$pngImage = Send-Image "/admin/products/$($ready.id)/images" $adminToken $png 'foto-batas-5mb.png' 'image/png'
$webpImage = Send-Image "/admin/products/$($ready.id)/images" $adminToken $webp 'foto-uji.webp' 'image/webp'
Assert-True ($jpgImage.imageUrl -match '/api/files/product-images/qa-buket-cepat-') 'Nama file gambar belum SEO-friendly'
Assert-True ($pngImage.imageUrl.EndsWith('.png')) 'Gambar PNG tidak tersimpan'
Assert-True ($webpImage.imageUrl.EndsWith('.webp')) 'Gambar WEBP tidak tersimpan'

$imageResponse = Invoke-WebRequest -UseBasicParsing "http://localhost:3000$($jpgImage.imageUrl)"
Assert-True ($imageResponse.StatusCode -eq 200) 'File gambar tidak dapat dirender langsung'
Invoke-Api DELETE "/admin/products/$($ready.id)/images/$($jpgImage.id)" $adminToken | Out-Null
$missingFileStatus = 0
try {
  Invoke-WebRequest -UseBasicParsing "http://localhost:3000$($jpgImage.imageUrl)" | Out-Null
} catch {
  $missingFileStatus = [int]$_.Exception.Response.StatusCode
}
Assert-True ($missingFileStatus -eq 404) 'File yang telah dihapus tidak menghasilkan 404'
Write-Host 'Tahap upload JPG, PNG 5MB, WEBP, dan 404 lulus'

$catalog = Invoke-Api GET "/products?page=1&limit=50&search=$([uri]::EscapeDataString($ready.name))"
Assert-True (@($catalog | Where-Object id -eq $ready.id).Count -eq 1) 'Produk baru tidak langsung muncul di katalog publik'

$timings = 1..5 | ForEach-Object {
  (Measure-Command { Invoke-RestMethod "$BaseUrl/products?page=1&limit=1" | Out-Null }).TotalMilliseconds
}
$sorted = $timings | Sort-Object
$p95 = $sorted[[Math]::Ceiling($sorted.Count * 0.95) - 1]

Invoke-Api DELETE '/cart' $customerToken | Out-Null
$start = (Get-Date).Date.AddDays(30)
$end = $start.AddDays(2)
$startDate = $start.ToString('yyyy-MM-dd')
$endDate = $end.ToString('yyyy-MM-dd')
Invoke-Api POST '/cart/items' $customerToken @{ productId = $ready.id; qty = 1 } | Out-Null
Invoke-Api POST '/cart/items' $customerToken @{ productId = $preorder.id; qty = 1 } | Out-Null
Invoke-Api POST '/cart/items' $customerToken @{
  productId = $rental.id
  qty = 5
  bookingDate = $startDate
  bookingEndDate = $endDate
} | Out-Null
$cart = Invoke-Api GET '/cart' $customerToken
Assert-True ($cart.Count -eq 3) 'Keranjang tidak memuat ready stock, preorder, dan sewa'
Write-Host 'Tahap keranjang lulus'

$address = @{
  fullAddress = 'Jl. Asia Afrika No. 10, Kota Bandung'
  latitude = '-6.9218'
  longitude = '107.6071'
}
$shipping = Invoke-Api POST '/checkout/estimate-ongkir' $customerToken @{
  deliveryType = 'DELIVERY'
  address = $address
}
Assert-True ([decimal]$shipping.fee -ge 0) 'Estimasi ongkir tidak valid'

$checkoutBody = @{
  deliveryType = 'DELIVERY'
  address = $address
  waNumber = '+6281111111103'
  customerName = 'Budi Santoso'
  recipientName = 'Penerima Pengujian'
  recipientPhone = '+6281111111103'
}
$checkout = Invoke-Api POST '/checkout' $customerToken $checkoutBody
Assert-True ([decimal]$checkout.dpAmount -gt 0) 'DP checkout tidak dihitung'
Assert-True ([decimal]$checkout.remainingAmount -gt 0) 'Sisa pelunasan tidak dihitung'
$orderId = $checkout.orderId
Write-Host 'Tahap checkout dan ongkir lulus'

$overlapRejected = $false
try {
  Invoke-Api POST '/checkout' $customerToken ($checkoutBody + @{
    items = @(@{
      productId = $rental.id
      qty = 1
      bookingDate = $startDate
      bookingEndDate = $endDate
    })
  }) | Out-Null
} catch {
  $overlapRejected = $_.Exception.Message -match '409|tersedia|available|berubah'
}
Assert-True $overlapRejected 'Bentrok rentang tanggal sewa tidak dicegah'
Write-Host 'Tahap pencegahan bentrok sewa lulus'

$proofPng = [byte[]]@(
  137, 80, 78, 71, 13, 10, 26, 10,
  0, 0, 0, 0, 0, 0, 0, 0,
  73, 69, 78, 68, 174, 66, 96, 130
)
$dpProof = Send-Image "/orders/$orderId/payment-proof/dp" $customerToken $proofPng 'bukti-dp.png' 'image/png'
Assert-True ($dpProof.verificationStatus -eq 'PENDING') 'Bukti DP tidak tersimpan'
Invoke-Api POST "/admin/orders/$orderId/verify-dp" $adminToken | Out-Null
Write-Host 'Tahap verifikasi DP lulus'
$finalProof = Send-Image "/orders/$orderId/payment-proof/final" $customerToken $proofPng 'bukti-pelunasan.png' 'image/png'
Assert-True ($finalProof.verificationStatus -eq 'PENDING') 'Bukti pelunasan tidak tersimpan'
Invoke-Api POST "/admin/orders/$orderId/verify-final" $adminToken | Out-Null
Write-Host 'Tahap verifikasi pelunasan lulus'

$order = Invoke-Api GET "/admin/orders/$orderId" $adminToken
Assert-True ($order.status -eq 'FULLY_PAID') 'Status setelah verifikasi pelunasan bukan FULLY_PAID'
Assert-True ($order.bookings.Count -eq 5) 'Lima unit fisik papan tidak dialokasikan'
$boards = Invoke-Api GET '/admin/boards' $adminToken
Assert-True (@($boards | Where-Object boardName -match '^PB-\d{3}$').Count -ge 5) 'Inventaris PB-001 dan seterusnya tidak tersedia'
$currentBoardId = $order.bookings[0].boardId
Invoke-Api PUT "/admin/orders/$orderId/reassign-board" $adminToken @{ boardId = $currentBoardId } | Out-Null
Invoke-Api POST "/admin/orders/$orderId/process" $adminToken | Out-Null
$completed = Invoke-Api POST "/admin/orders/$orderId/complete" $adminToken
Assert-True ($completed.status -eq 'COMPLETED') 'Alur PROCESSING ke COMPLETED gagal'
Write-Host 'Tahap alokasi papan dan penyelesaian pesanan lulus'

$today = (Get-Date).ToString('yyyy-MM-dd')
$cost = Invoke-Api POST '/admin/finance/product-costs' $adminToken @{
  productId = $ready.id
  costPrice = 70000
  effectiveDate = $today
}
$capital = Invoke-Api POST '/admin/finance/capital' $adminToken @{
  amount = 1000000
  source = "QA Otomatis $suffix"
  note = 'Data akan dibersihkan setelah pengujian'
  injectedAt = $today
}
$expense = Invoke-Api POST '/admin/finance/expenses' $adminToken @{
  category = 'OTHER'
  amount = 25000
  description = "QA Otomatis $suffix"
  expenseDate = $today
}
$from = (Get-Date).AddDays(-1).ToString('yyyy-MM-dd')
$to = (Get-Date).AddDays(1).ToString('yyyy-MM-dd')
$summary = Invoke-Api GET "/admin/reports/summary?from=$from&to=$to" $adminToken
$chart = Invoke-Api GET "/admin/reports/chart-data?from=$from&to=$to&type=daily" $adminToken
Assert-True ($null -ne $summary) 'Ringkasan laporan gagal dimuat'
Assert-True ($null -ne $chart) 'Data grafik laporan gagal dimuat'

[pscustomobject]@{
  result = 'LULUS'
  orderId = $orderId
  productIds = $script:CreatedProductIds
  financeIds = @{
    cost = $cost.id
    capital = $capital.id
    expense = $expense.id
  }
  imageFormats = @('JPG', 'PNG 5MB', 'WEBP')
  apiP95Ms = [Math]::Round($p95, 2)
  apiAverageMs = [Math]::Round(($timings | Measure-Object -Average).Average, 2)
} | ConvertTo-Json -Depth 8
