const fs = require('fs');
const path = require('path');

// 원본 GeoJSON 파일 읽기
const sourceFile = path.join(__dirname, 'sig (1).json');
const geoJsonData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

// 지역별로 분류할 객체 생성
const regions = {
    'seoul': { features: [], name: '서울' },
    'gyeonggi': { features: [], name: '경기도' },
    'gangwon': { features: [], name: '강원도' },
    'chungnam': { features: [], name: '충청남도' },
    'chungbuk': { features: [], name: '충청북도' },
    'jeonnam': { features: [], name: '전라남도' },
    'jeonbuk': { features: [], name: '전라북도' },
    'gyeongnam': { features: [], name: '경상남도' },
    'gyeongbuk': { features: [], name: '경상북도' },
    'jeju': { features: [], name: '제주도' },
    'incheon': { features: [], name: '인천' },
    'daejeon': { features: [], name: '대전' },
    'daegu': { features: [], name: '대구' },
    'busan': { features: [], name: '부산' },
    'ulsan': { features: [], name: '울산' },
    'gwangju': { features: [], name: '광주' },
    'sejong': { features: [], name: '세종' }
};

// 강원도 지역 코드 매핑 (SIG_CD 앞 두 자리가 42인 경우 강원도)
const regionCodeMap = {
    '11': 'seoul',    // 서울
    '26': 'busan',    // 부산
    '27': 'daegu',    // 대구
    '28': 'incheon',  // 인천
    '29': 'gwangju',  // 광주
    '30': 'daejeon',  // 대전
    '31': 'ulsan',    // 울산
    '36': 'sejong',   // 세종
    '41': 'gyeonggi', // 경기도
    '42': 'gangwon',  // 강원도
    '43': 'chungbuk', // 충청북도
    '44': 'chungnam', // 충청남도
    '45': 'jeonbuk',  // 전라북도
    '46': 'jeonnam',  // 전라남도
    '47': 'gyeongbuk', // 경상북도
    '48': 'gyeongnam', // 경상남도
    '50': 'jeju'      // 제주도
};

// 각 feature를 지역별로 분류
geoJsonData.features.forEach(feature => {
    const sigCd = feature.properties.SIG_CD;
    const regionCode = sigCd.substring(0, 2);
    
    if (regionCodeMap[regionCode]) {
        regions[regionCodeMap[regionCode]].features.push(feature);
    } else {
        console.log(`Unknown region code: ${regionCode} for SIG_CD: ${sigCd}`);
    }
});

// 각 지역별로 GeoJSON 파일 생성
Object.keys(regions).forEach(regionKey => {
    const region = regions[regionKey];
    
    // 해당 지역에 feature가 있는 경우에만 파일 생성
    if (region.features.length > 0) {
        const outputData = {
            type: "FeatureCollection",
            bbox: geoJsonData.bbox, // 원본 bbox 유지 또는 필요시 새로 계산
            features: region.features
        };
        
        const outputFile = path.join(__dirname, `${regionKey}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
        console.log(`Created ${regionKey}.json with ${region.features.length} features`);
    } else {
        console.log(`No features found for ${regionKey}`);
    }
});

console.log('GeoJSON split completed successfully!');
