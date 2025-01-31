<template>
  <div>
    <input type="file" @change="handleFileUpload" />
    <button @click="processExcel">파일 처리</button>
    <button @click="stopProcessing" :disabled="!isProcessing">중단</button>
    <p v-if="progressMessage">{{ progressMessage }}</p>
    <a v-if="downloadUrl" :href="downloadUrl" download="updated.xlsx"
      >수정된 파일 다운로드</a
    >
    <div id="roadview"></div>
  </div>
</template>

<script>
import * as XLSX from "xlsx";

export default {
  data() {
    return {
      file: null,
      downloadUrl: null,
      progressMessage: "",
      stopRequested: false,
    };
  },
  methods: {
    stopProcessing() {
      this.stopRequested = true;
      this.progressMessage = "중단 요청됨...";
    },
    handleFileUpload(event) {
      this.file = event.target.files[0];
    },
    waitForKakaoAPI(callback) {
      let interval = setInterval(() => {
        if (
          typeof kakao !== "undefined" &&
          kakao.maps &&
          kakao.maps.RoadviewClient
        ) {
          clearInterval(interval);
          callback();
        }
      }, 100);
    },
    async getValidPanoId(lat, lng) {
      // var roadview = new kakao.maps.Roadview();

      var roadviewClient = new kakao.maps.RoadviewClient();
      var position = new kakao.maps.LatLng(lat, lng);
      console.log("position: ", position.getLat(), position.getLng());
      roadviewClient.getNearestPanoId(position, 300, (panoId) => {
        console.log("changed position: ", position.getLat(), position.getLng());
        console.log(panoId);
        return panoId;
      });
    },
    async processExcel() {
      if (!this.file) {
        alert("엑셀 파일을 업로드하세요.");
        return;
      }
      this.isProcessing = true;
      this.progressMessage = "파일 처리 중...";
      this.stopRequested = false; // 중단 요청 초기화

      const reader = new FileReader();
      reader.onload = async (e) => {
        const workbook = XLSX.read(e.target.result, { type: "binary" });

        for (const sheetName of workbook.SheetNames) {
          if (this.stopRequested) {
            break; // 중단 요청 시 루프 종료
          }
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          for (let i = 1; i < jsonData.length; i++) {
            if (this.stopRequested) {
              break; // 중단 요청 시 루프 종료
            }
            let lat = jsonData[i][5]; // F 라인
            let lng = jsonData[i][6]; // G 라인
            if (!lat || !lng) continue;

            const panoId = await this.getValidPanoId(lat, lng);
            console.log(panoId);
            if (panoId) {
              jsonData[i][7] = "변경 없음"; // H 라인
            } else {
              const newPanoId = await this.getValidPanoId(lat, lng);
              console.log("new panoId: ", newPanoId);
              if (newPanoId) {
                jsonData[i][8] = lat; // I 라인 (변경 전 위도)
                jsonData[i][9] = lng; // J 라인 (변경 전 경도)
                jsonData[i][5] = newPanoId.lat; // 새로운 위도
                jsonData[i][6] = newPanoId.lng; // 새로운 경도
                jsonData[i][7] = "변경됨";
              } else {
                jsonData[i][7] = "변경 불가";
              }
            }
            console.log(`${sheetName} - ${i}: ${jsonData[i][7]}`);
          }

          workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(jsonData);
        }

        const wbout = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "binary",
        });
        const blob = new Blob([this.s2ab(wbout)], {
          type: "application/octet-stream",
        });
        this.downloadUrl = URL.createObjectURL(blob);
      };
      reader.readAsBinaryString(this.file);
    },
    s2ab(s) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    },
  },
  mounted() {
    const script = document.createElement("script");
    script.src =
      "https://dapi.kakao.com/v2/maps/sdk.js?appkey=c66fbf360458039285570a638bad813a&libraries=services&autoload=false";
    script.onload = () => console.log("Kakao Map API loaded");
    document.head.appendChild(script);
  },
};
</script>
