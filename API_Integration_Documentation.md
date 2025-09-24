# Brendoo Integration API Sənədləşdirməsi

## Ümumi Məlumat

Bu sənəd Brendoo sisteminin integration API-si üçün istifadə təlimatlarını təqdim edir. Bu API vasitəsilə xarici sistemlər Brendoo məhsul bazasından məlumat əldə edə bilərlər.

## API Endpoint Məlumatları

### Mağaza Məhsulları API-si

**Endpoint:** `GET /api/v1/products-stock/integration/store`

**Təsvir:** Bu endpoint müəyyən mağazanın bütün aktiv məhsullarını paginasiyasız qaytarır.

**Base URL:** `http://localhost:5009`

**Tam URL:** `http://localhost:5009/api/v1/products-stock/integration/store?store={mağaza_adı}`

## Parametrlər

### Query Parametrləri

| Parametr | Tip | Tələb olunan | Təsvir |
|----------|-----|--------------|--------|
| `store` | string | Bəli | Məhsulları əldə ediləcək mağazanın adı |

### Nümunə Parametrlər

- `store=gosport` - Gosport mağazasının məhsulları
- `store=zara` - Zara mağazasının məhsulları
- `store=nike` - Nike mağazasının məhsulları

## İstək Nümunələri

### 1. cURL ilə İstək

```bash
curl -X GET "http://localhost:5009/api/v1/products-stock/integration/store?store=gosport"
```

### 2. PowerShell ilə İstək

```powershell
Invoke-WebRequest -Uri "http://localhost:5009/api/v1/products-stock/integration/store?store=gosport" -Method GET
```

### 3. JavaScript (Fetch API) ilə İstək

```javascript
fetch('http://localhost:5009/api/v1/products-stock/integration/store?store=gosport')
  .then(response => response.json())
  .then(data => {
    console.log('Məhsullar:', data);
  })
  .catch(error => {
    console.error('Xəta:', error);
  });
```

### 4. Python (requests) ilə İstək

```python
import requests

url = "http://localhost:5009/api/v1/products-stock/integration/store"
params = {"store": "gosport"}

response = requests.get(url, params=params)
data = response.json()

print(f"Status: {response.status_code}")
print(f"Məhsul sayı: {data['totalProducts']}")
```

## Cavab Formatı

### Uğurlu Cavab (200 OK)

```json
{
  "success": true,
  "message": "All products from gosport store retrieved successfully",
  "store": "gosport",
  "totalProducts": 22,
  "data": [
    {
      "_id": "68d3c8da71741577150534b7",
      "name": "nike sportswear everyday essential crew socks",
      "brand": "NIKE",
      "price": 15.99,
      "currency": "USD",
      "priceInRubles": 1519.05,
      "discountedPrice": null,
      "category": "ACCESSORIES",
      "store": "gosport",
      "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ],
      "sizes": ["S", "M", "L", "XL"],
      "colors": ["Black", "White", "Gray"],
      "stockStatus": "IN_STOCK",
      "createdAt": "2024-09-15T10:30:45.123Z",
      "updatedAt": "2024-09-15T10:30:45.123Z"
    }
    // ... digər məhsullar
  ],
  "generatedAt": "2024-09-24T10:46:06.123Z"
}
```

### Xəta Cavabı (400 Bad Request)

```json
{
  "success": false,
  "message": "Store parameter is required"
}
```

### Server Xətası (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Server error occurred while retrieving store products",
  "error": "Xəta təfərrüatları"
}
```

## Məhsul Sahələrinin Təsviri

| Sahə | Tip | Təsvir |
|------|-----|--------|
| `_id` | string | Məhsulun unikal identifikatoru |
| `name` | string | Məhsulun adı |
| `brand` | string | Məhsulun brendi (böyük hərflərlə) |
| `price` | number | Məhsulun qiyməti |
| `currency` | string | Valyuta kodu (USD, EUR, və s.) |
| `priceInRubles` | number | Qiymətin rubl qarşılığı |
| `discountedPrice` | number/null | Endirimli qiymət (varsa) |
| `category` | string | Məhsul kateqoriyası |
| `store` | string | Mağaza adı |
| `images` | array | Məhsul şəkillərinin URL-ləri |
| `sizes` | array | Mövcud ölçülər |
| `colors` | array | Mövcud rənglər |
| `stockStatus` | string | Stok vəziyyəti (IN_STOCK, OUT_OF_STOCK) |
| `createdAt` | string | Yaradılma tarixi (ISO format) |
| `updatedAt` | string | Yenilənmə tarixi (ISO format) |

## Xüsusiyyətlər

### ✅ Üstünlüklər

- **Paginasiyasız:** Bütün məhsullar bir sorğuda qaytarılır
- **Authentication yoxdur:** API açıq istifadə üçündür
- **Yüksək performans:** Yalnız lazım olan sahələr qaytarılır
- **Aktiv məhsullar:** Yalnız aktiv məhsullar göstərilir
- **Sıralanmış:** Məhsullar yaradılma tarixinə görə sıralanır

### ⚠️ Məhdudiyyətlər

- Yalnız aktiv məhsullar qaytarılır
- Silinmiş məhsullar göstərilmir
- Böyük məhsul sayı olan mağazalar üçün cavab ölçüsü böyük ola bilər

## Mövcud Mağazalar

API-də test edilmiş mağazalar:

- `gosport` - 22 məhsul
- `zara` - 1108 məhsul
- `nike` - (məhsul sayı dəyişkən)

## Xəta Halları və Həlləri

### 1. "Store parameter is required" Xətası

**Səbəb:** `store` parametri göndərilməyib

**Həll:** URL-də `?store=mağaza_adı` parametrini əlavə edin

```
✗ Yanlış: http://localhost:5009/api/v1/products-stock/integration/store
✓ Düzgün: http://localhost:5009/api/v1/products-stock/integration/store?store=gosport
```

### 2. Boş Nəticə

**Səbəb:** Göstərilən mağazada aktiv məhsul yoxdur

**Həll:** Mağaza adını yoxlayın və ya digər mağaza adlarını sınayın

### 3. Server Xətası

**Səbəb:** Verilənlər bazası əlaqə problemi və ya server xətası

**Həll:** Bir neçə dəqiqə sonra yenidən cəhd edin

## İstifadə Nümunələri

### E-commerce Integration

```javascript
// Mağaza məhsullarını əldə et və öz sistemə əlavə et
async function syncStoreProducts(storeName) {
  try {
    const response = await fetch(
      `http://localhost:5009/api/v1/products-stock/integration/store?store=${storeName}`
    );
    const data = await response.json();
    
    if (data.success) {
      console.log(`${data.totalProducts} məhsul tapıldı`);
      
      // Məhsulları öz sistemə əlavə et
      for (const product of data.data) {
        await addProductToMySystem(product);
      }
    }
  } catch (error) {
    console.error('Sync xətası:', error);
  }
}
```

### Qiymət Müqayisəsi

```javascript
// Müxtəlif mağazalarda qiymət müqayisəsi
async function compareStorePrices(stores) {
  const allProducts = [];
  
  for (const store of stores) {
    const response = await fetch(
      `http://localhost:5009/api/v1/products-stock/integration/store?store=${store}`
    );
    const data = await response.json();
    
    if (data.success) {
      allProducts.push(...data.data);
    }
  }
  
  // Qiymət müqayisəsi məntiqini burada həyata keçirin
  return allProducts;
}
```

## Texniki Dəstək

API ilə bağlı problemlər yaşadığınız halda:

1. Server-in işlədiyini yoxlayın: `http://localhost:5009/test`
2. Parametrlərin düzgün göndərildiyini yoxlayın
3. Mağaza adının düzgün yazıldığını təsdiqləyin

## Versiya Məlumatları

- **API Versiyası:** v1
- **Son Yeniləmə:** 24 Sentyabr 2024
- **Dəstəklənən Formatlar:** JSON
- **Encoding:** UTF-8

---

*Bu sənəd Brendoo Integration API-si üçün hazırlanmışdır. Suallarınız olduqda texniki komanda ilə əlaqə saxlayın.*