// src/scripts/convertSidoJson.js
// sido.json의 GeoJSON 좌표(lng, lat)를 Kakao Map Polygon용 [lat, lng] 배열로 변환하는 스크립트
// 실행: node src/scripts/convertSidoJson.js

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../assets/map/sido.json');
const outputPath = path.join(__dirname, '../assets/map/sido_kakao.json');

function convertCoordinates(coords) {
  // Polygon: [ [ [lng, lat], ... ] ]
  return coords.map(
    ring => ring.map(([lng, lat]) => [lat, lng])
  );
}

function isClosed(ring) {
  if (ring.length < 2) return false;
  const [firstLng, firstLat] = ring[0];
  const [lastLng, lastLat] = ring[ring.length - 1];
  return firstLng === lastLng && firstLat === lastLat;
}

function closeRing(ring) {
  if (!isClosed(ring)) {
    ring.push([...ring[0]]);
  }
  return ring;
}

function main() {
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const features = data.features.map(f => {
    let coords = f.geometry.coordinates;
    // Polygon: [ [ [lng, lat], ... ] ]
    coords = coords.map(ring => closeRing(ring));
    const kakaoCoords = convertCoordinates(coords);
    return {
      ...f,
      geometry: {
        ...f.geometry,
        coordinates: kakaoCoords
      }
    };
  });
  const output = {
    ...data,
    features
  };
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log('변환 완료: sido_kakao.json');
}

main();
