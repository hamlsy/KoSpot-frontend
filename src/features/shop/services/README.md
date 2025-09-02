# Shop Service

사용자용 상점 기능을 위한 백엔드 API 연동 서비스입니다.

## 파일 구조

```
services/
├── shop.service.js    # 상점 API 서비스
└── README.md          # 이 문서
```

## 주요 기능

### 1. 아이템 조회

```javascript
import { shopService } from './shop.service.js';

// 아이템 타입별 조회
const response = await shopService.getItemsByType('MARKER');
if (response.isSuccess) {
  const items = response.result; // ShopItemResponse[]
}
```

**지원하는 아이템 타입:**
- `MARKER`: 마커
- `NICKNAME`: 닉네임 꾸미기
- `ITEM`: 일반 아이템
- `PROFILE`: 프로필
- `BACKGROUND`: 배경

### 2. 아이템 구매

```javascript
// 아이템 구매
const response = await shopService.purchaseItem(itemId);
if (response.isSuccess) {
  console.log('구매 완료');
  // UI 업데이트: owned = true, memberItemId 설정
}
```

### 3. 아이템 장착

```javascript
// 아이템 장착 (마커, 닉네임 등)
const response = await shopService.equipItem(memberItemId);
if (response.isSuccess) {
  console.log('장착 완료');
  // UI 업데이트: equipped = true
}
```

## API 응답 형식

### 아이템 조회 응답
```javascript
{
  isSuccess: true,
  code: 0,
  message: "string",
  result: [
    {
      itemId: 123,
      name: "별 마커",
      description: "별 모양의 마커입니다.",
      price: 2000,
      stock: 999,
      imageUrl: "https://example.com/star.png",
      owned: false,
      memberItemId: null, // 보유 시에만 값 존재
      equipped: false     // 장착 여부
    }
  ]
}
```

### 구매/장착 응답
```javascript
{
  isSuccess: true,
  code: 0,
  message: "string",
  result: {}
}
```

## ShopView.vue 연동

### 기본 설정

```javascript
// ShopView.vue에서 사용
import { shopService } from '@/features/shop/services/shop.service.js'

export default {
  data() {
    return {
      loading: false,
      useApiData: true,
      apiItems: {}
    }
  }
}
```

### 아이템 로드

```javascript
async loadItems() {
  try {
    this.loading = true;
    const itemTypeKey = shopService.getCategoryToItemTypeKey(this.currentCategory);
    const response = await shopService.getItemsByType(itemTypeKey);
    
    if (response.isSuccess) {
      const apiItems = response.result.map(item => 
        shopService.convertApiToUiFormat(item, this.currentCategory)
      );
      this.$set(this.apiItems, this.currentCategory, apiItems);
    }
  } catch (error) {
    // 에러 시 더미 데이터로 폴백
    this.useApiData = false;
  } finally {
    this.loading = false;
  }
}
```

### 아이템 구매

```javascript
async confirmPurchase() {
  try {
    const response = await shopService.purchaseItem(this.selectedItem.itemId);
    
    if (response.isSuccess) {
      // UI 업데이트
      const items = this.apiItems[this.selectedItem.category];
      const itemIndex = items.findIndex(item => item.itemId === this.selectedItem.itemId);
      if (itemIndex !== -1) {
        items[itemIndex].owned = true;
        items[itemIndex].memberItemId = response.result?.memberItemId;
      }
      
      alert(`${this.selectedItem.name}을(를) 구매했습니다!`);
    }
  } catch (error) {
    alert('구매에 실패했습니다.');
  }
}
```

### 아이템 장착

```javascript
async equipItem(item) {
  try {
    const response = await shopService.equipItem(item.memberItemId);
    
    if (response.isSuccess) {
      // 해당 카테고리의 다른 아이템들 장착 해제
      const items = this.apiItems[this.currentCategory];
      items.forEach(categoryItem => {
        categoryItem.equipped = false;
      });
      
      // 선택한 아이템만 장착
      const itemIndex = items.findIndex(categoryItem => categoryItem.memberItemId === item.memberItemId);
      if (itemIndex !== -1) {
        items[itemIndex].equipped = true;
      }
      
      alert(`${item.name}을(를) 장착했습니다!`);
    }
  } catch (error) {
    alert('장착에 실패했습니다.');
  }
}
```

## UI 상태 관리

### 아이템 카드 클래스

```html
<div 
  class="shop-item"
  :class="{ 
    'owned': item.owned, 
    'equipped': item.equipped 
  }"
>
```

### 버튼 상태

```html
<!-- 구매 버튼 -->
<button 
  v-if="!item.owned"
  class="buy-button" 
  :disabled="!canAfford(item) || loading"
  @click="buyItem(item)"
>
  구매하기
</button>

<!-- 장착 버튼 (장착 가능한 카테고리만) -->
<button 
  v-else-if="shopService.isEquippableCategory(currentCategory)"
  class="equip-button"
  :class="{ 'equipped': item.equipped }"
  :disabled="loading"
  @click="equipItem(item)"
>
  {{ item.equipped ? '장착 중' : '장착하기' }}
</button>

<!-- 보유 표시 -->
<div v-else class="owned-indicator">
  <i class="fas fa-check"></i>
  보유 중
</div>
```

## 유틸리티 메서드

### 카테고리 변환

```javascript
// UI 카테고리 ID → API 아이템 타입 키
const itemTypeKey = shopService.getCategoryToItemTypeKey('markers'); // 'MARKER'

// 장착 가능 여부 확인
const canEquip = shopService.isEquippableCategory('markers'); // true
```

### 데이터 변환

```javascript
// API 형식 → UI 형식
const uiItem = shopService.convertApiToUiFormat(apiItem, 'markers');

// 더미 데이터 → API 형식
const apiItems = shopService.convertDummyToApiFormat(dummyItems);
```

### 가격 포맷팅

```javascript
const formattedPrice = shopService.formatPrice(1234567); // "1,234,567"
```

## 에러 처리

서비스는 다음과 같은 에러를 자동으로 처리합니다:

- **네트워크 에러**: "서버에 연결할 수 없습니다."
- **서버 에러**: 서버 응답의 에러 메시지 사용
- **기본 에러**: 메서드별 기본 에러 메시지

```javascript
try {
  await shopService.purchaseItem(itemId);
} catch (error) {
  alert(error.message || '구매에 실패했습니다.');
}
```

## 폴백 전략

API 실패 시 더미 데이터로 자동 폴백:

```javascript
// ShopView.vue에서
data() {
  return {
    useApiData: true, // API 우선 사용
    apiItems: {},     // API 데이터
    shopItems: {      // 더미 데이터 (폴백용)
      markers: [...],
      nicknames: [...],
      items: [...]
    }
  }
}

// computed에서 자동 선택
currentCategoryItems() {
  if (this.useApiData && this.apiItems[this.currentCategory]) {
    return this.apiItems[this.currentCategory]; // API 데이터 사용
  }
  return this.shopItems[this.currentCategory] || []; // 더미 데이터 폴백
}
```

## Swagger API 연동

이 서비스는 다음 Swagger API와 연동됩니다:

- `GET /item/{itemTypeKey}`: 아이템 타입별 조회
- `GET /memberItem/{itemId}/purchase`: 아이템 구매
- `GET /memberItem/{memberItemId}`: 아이템 장착

## 사용 시 주의사항

1. **API 우선**: API 연결이 우선되며, 실패 시에만 더미 데이터 사용
2. **memberItemId**: 구매한 아이템만 가지는 고유 ID (장착 시 필요)
3. **장착 가능성**: 마커, 닉네임 등만 장착 가능
4. **상태 동기화**: API 호출 후 UI 상태를 즉시 업데이트
5. **로딩 관리**: 모든 API 호출 시 로딩 상태 관리

## 의존성

- `src/core/api/apiClient.js`: Axios 클라이언트 인스턴스
- 사용자 인증 토큰 필요
