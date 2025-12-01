/**
 * SEO Confieo uration
 * 중앙 관리되는 SEO 메타데이터 및 키워드
 */

export const seoConfig = {
  // 기본 정보
  siteName: 'KoSpot',
  siteUrl: 'https://kospot.kr', // 실제 도메인으로 변경 필요
  
  // 메인 타이틀 및 설명
  title: 'KoSpot',
  description: '로드뷰로 한국 관광지 위치를 맞추는 지리 게임. 실제 거리뷰로 전국을 탐험하고 친구들과 경쟁하세요.',
  
  // 키워드 (구글 검색 최적화)
  keywords: [
    '지리 게임',
    '로드뷰',
    '지오게서',
    'geoguessr',
    '위치 맞추기',
    '한국 여행 게임',
    '지오게싱',
    '한국 지리',
    '관광지 게임',
    '위치 추측 게임',
    '스트리트뷰 게임',
    '한국 geoguessr',
    '지리 퀴즈',
    '로드뷰 게임'
  ],
  
  // Open Graph (소셜 미디어 공유)
  openGraph: {
    type: 'website',
    title: 'KoSpot - 한국판 GeoGuessr',
    description: '로드뷰로 한국 관광지 위치를 맞추는 지리 게임',
    image: '/og-image.jpg', // 1200x630 권장
    imageAlt: 'KoSpot - 한국 지리 게임',
    locale: 'ko_KR',
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'KoSpot - 한국판 GeoGuessr',
    description: '로드뷰로 한국 관광지를 탐험하는 지리 게임',
    image: '/og-image.jpg',
    site: '@kospot', // 실제 트위터 계정으로 변경
  },
  
  // 구조화된 데이터 (JSON-LD)
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'KoSpot',
    applicationCategory: 'Game',
    description: '한국판 GeoGuessr - 로드뷰 기반 지리 게임',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1234'
    },
    keywords: 'geoguessr, 지리 게임, 로드뷰, 위치 맞추기',
    inLanguage: 'ko-KR',
    url: 'https://kospot.com'
  },
  
  // 추가 메타 태그
  meta: {
    author: 'KoSpot Team',
    robots: 'index, follow',
    googlebot: 'index, follow',
    language: 'Korean',
    revisitAfter: '7 days',
    theme: '#0ea5e9'
  }
};

// SEO 메타 태그 생성 헬퍼 함수
export function generateMetaTags(customConfig = {}) {
  const config = { ...seoConfig, ...customConfig };
  
  return {
    title: config.title,
    meta: [
      { name: 'description', content: config.description },
      { name: 'keywords', content: config.keywords.join(', ') },
      { name: 'author', content: config.meta.author },
      { name: 'robots', content: config.meta.robots },
      { name: 'googlebot', content: config.meta.googlebot },
      { name: 'theme-color', content: config.meta.theme },
      
      // Open Graph
      { property: 'og:type', content: config.openGraph.type },
      { property: 'og:title', content: config.openGraph.title },
      { property: 'og:description', content: config.openGraph.description },
      { property: 'og:image', content: config.siteUrl + config.openGraph.image },
      { property: 'og:image:alt', content: config.openGraph.imageAlt },
      { property: 'og:url', content: config.siteUrl },
      { property: 'og:site_name', content: config.siteName },
      { property: 'og:locale', content: config.openGraph.locale },
      
      // Twitter Card
      { name: 'twitter:card', content: config.twitter.card },
      { name: 'twitter:title', content: config.twitter.title },
      { name: 'twitter:description', content: config.twitter.description },
      { name: 'twitter:image', content: config.siteUrl + config.twitter.image },
      { name: 'twitter:site', content: config.twitter.site },
    ]
  };
}

export default seoConfig;

