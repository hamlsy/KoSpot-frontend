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
      currentLat: "",
      currentLng: "",
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
    getValidPosition(lat, lng) {
      // var roadview = new kakao.maps.Roadview();
      var container = document.getElementById("roadview");
      let roadviewClient = new kakao.maps.RoadviewClient(),
        position = new kakao.maps.LatLng(lat, lng),
        roadview = new kakao.maps.Roadview(container);
      console.log("---------START----------");
      console.log("first position: ", position.getLat(), position.getLng());
      roadviewClient.getNearestPanoId(position, 400, function (panoId) {
        roadview.setPanoId(panoId, position);
      });

      kakao.maps.event.addListener(roadview, "panoid_changed", () => {
        this.currentLat = roadview
          .getPosition()
          .toString()
          .replace(/[()]/g, "")
          .split(",")[0];
        this.currentLng = roadview
          .getPosition()
          .toString()
          .replace(/[()]/g, "")
          .split(",")[1];
        console.log(
          "Listener event! currentLat: ",
          this.currentLat,
          "currentLng: ",
          this.currentLng
        );
      });
      return new kakao.maps.LatLng(this.currentLat, this.currentLng);
    },
    async processExcel() {
      if (!this.file) {
        alert("엑셀 파일을 업로드하세요.");
        return;
      }
      this.isProcessing = true;
      this.progressMessage = "파일 처리 중...";
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.stopRequested = false; // 중단 요청 초기화

      // 첫 요청 초기화
      var container = document.getElementById("roadview");
      let roadviewClient = new kakao.maps.RoadviewClient(),
        position = new kakao.maps.LatLng(37.5666103, 126.9783882), //서울
        roadview = new kakao.maps.Roadview(container);
      roadviewClient.getNearestPanoId(position, 400, function (panoId) {
        roadview.setPanoId(panoId, position);
      });

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

            const newPosition = this.getValidPosition(lat, lng);
            await new Promise((resolve) => setTimeout(resolve, 650));

            if (newPosition.getLat() === lat && newPosition.getLng() === lng) {
              jsonData[i][7] = "변경 없음"; // H 라인
            } else {
              if (
                newPosition.getLat() !== lat ||
                newPosition.getLng() !== lng
              ) {
                jsonData[i][8] = lat; // I 라인 (변경 전 위도)
                jsonData[i][9] = lng; // J 라인 (변경 전 경도)
                jsonData[i][5] = newPosition.getLat(); // 새로운 위도
                jsonData[i][6] = newPosition.getLng(); // 새로운 경도
                jsonData[i][7] = "변경됨";
                console.log(
                  "new Position!: ",
                  newPosition.getLat(),
                  newPosition.getLng()
                );
              } else {
                jsonData[i][7] = "변경 불가";
              }
            }
            console.log(`${sheetName} - ${i}: ${jsonData[i][7]}`);
            console.log("----------END---------");
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

<style scoped>
#roadview {
  width: 100%;
  height: 300px;
}
</style>
