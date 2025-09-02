# Admin Services

관리자 기능을 위한 백엔드 API 연동 서비스들입니다.

## 파일 구조

```
services/
├── shopAdmin.service.js    # 상점 관리 API 서비스
└── README.md               # 이 문서
```

## Shop Admin Service

상점 아이템 관리를 위한 API 서비스입니다.

### 주요 기능

#### 1. 아이템 조회

```javascript
import { shopAdminService } from './shopAdmin.service.js';

// 특정 타입의 아이템들 조회
const response = await shopAdminService.getItemsByType('MARKER');
if (response.isSuccess) {
  const items = response.result; // ItemResponse[] 
}
```

**지원하는 아이템 타입:**
- `MARKER`: 마커
- `NICKNAME`: 닉네임 꾸미기  
- `ITEM`: 일반 아이템
- `PROFILE`: 프로필
- `BACKGROUND`: 배경

#### 2. 아이템 생성

```javascript
// 새 아이템 생성
const itemData = {
  title: "새로운 마커",
  content: "별 모양의 마커입니다.",
  images: ["https://example.com/star-marker.png"]
};

const response = await shopAdminService.createItem(itemData);
```

#### 3. 아이템 수정

```javascript
// 아이템 정보 업데이트
const updateData = {
  itemId: 123,
  name: "수정된 마커",
  description: "업데이트된 설명",
  price: 2500,
  itemTypeKey: "MARKER",
  quantity: 100
};

const response = await shopAdminService.updateItem(updateData);
```

#### 4. 아이템 삭제

```javascript
// 아이템 완전 삭제
const response = await shopAdminService.deleteItem(123);
```

#### 5. 상점 등록/삭제

```javascript
// 아이템을 상점에 재등록
const response = await shopAdminService.restoreItemToShop(123);

// 아이템을 상점에서 숨기기 (삭제하지 않고 숨김)
const response = await shopAdminService.removeItemFromShop(123);
```

### API 응답 형식

#### 공통 응답 형식
```javascript
{
  isSuccess: boolean,
  code: number,
  message: string,
  result: any
}
```

#### 아이템 응답 데이터
```javascript
{
  itemId: number,
  name: string,
  description: string,
  price: number,
  stock: number,
  imageUrl: string,
  owned: boolean
}
```

### 유틸리티 메서드

#### 아이템 타입 목록 가져오기
```javascript
const itemTypes = shopAdminService.getItemTypes();
// 반환값: [{ key: 'MARKER', name: '마커', icon: 'fas fa-map-marker-alt' }, ...]
```

#### 가격 포맷팅
```javascript
const formattedPrice = shopAdminService.formatPrice(1234567);
// 반환값: "1,234,567"
```

### 에러 처리

서비스는 다음과 같은 에러를 자동으로 처리합니다:

- **네트워크 에러**: "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요."
- **서버 에러**: 서버에서 제공하는 에러 메시지 사용
- **기본 에러**: 메서드별 기본 에러 메시지

```javascript
try {
  const response = await shopAdminService.createItem(itemData);
} catch (error) {
  console.error('아이템 생성 실패:', error.message);
  // 사용자에게 에러 메시지 표시
}
```

### 컴포넌트 사용 예시

#### ShopManager.vue에서의 사용

```javascript
// 아이템 목록 로드
const loadItems = async () => {
  try {
    loading.value = true
    const response = await shopAdminService.getItemsByType(currentItemType.value)
    
    if (response.isSuccess) {
      items.value = response.result.map(item => ({
        ...item,
        inShop: item.inShop !== undefined ? item.inShop : true
      }))
    }
  } catch (error) {
    console.error('아이템 로드 중 오류:', error)
  } finally {
    loading.value = false
  }
}

// 아이템 저장
const saveItem = async (itemData) => {
  try {
    if (isEditMode.value) {
      await shopAdminService.updateItem({
        itemId: editingItem.value.itemId,
        ...itemData
      })
    } else {
      await shopAdminService.createItem(itemData)
    }
    
    await loadItems() // 목록 새로고침
  } catch (error) {
    alert('아이템 저장에 실패했습니다.')
  }
}
```

### Swagger API 연동

이 서비스는 다음 Swagger API 엔드포인트와 연동됩니다:

- `GET /item/{itemTypeKey}`: 아이템 타입별 조회
- `POST /item/`: 아이템 등록  
- `PUT /item/info`: 아이템 정보 업데이트
- `DELETE /item/{id}`: 아이템 삭제
- `PUT /item/{id}/restoreShop`: 아이템 상점 재등록
- `PUT /item/{id}/deleteShop`: 아이템 상점 삭제

### 인증 및 권한

- API 클라이언트에서 자동으로 JWT 토큰을 첨부합니다
- 관리자 권한이 필요한 API입니다
- 토큰 만료 시 자동 갱신을 시도합니다

### 의존성

- `src/core/api/apiClient.js`: Axios 클라이언트 인스턴스
- 관리자 인증 토큰 필요

### 사용 시 주의사항

1. **아이템 타입**: 반드시 지원하는 아이템 타입 키를 사용하세요
2. **이미지 URL**: 유효한 이미지 URL을 제공하세요
3. **가격**: 음수 값은 허용되지 않습니다
4. **에러 처리**: try-catch를 사용하여 적절한 에러 처리를 구현하세요
5. **로딩 상태**: 사용자 경험을 위해 로딩 상태를 관리하세요
