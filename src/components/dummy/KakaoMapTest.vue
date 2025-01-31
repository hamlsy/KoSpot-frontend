<template>
    <div>
        <button @click="viewKakaoMap">로드뷰 가져오기</button>
        <h1>좌표를 입력하세요</h1>
        <!--위도  -->
        <input type="text" v-model="lat" placeholder="위도" />
        <!-- 경도 -->
        <input type="text" v-model="lng" placeholder="경도" />
        <div id="roadview"></div>
        <div id="initialMap"></div>
        <div id="updatedMap"></div>
        <button @click="showCurrentPosition">현재 좌표는?</button>
        <p>{{ currentPosition }}</p>
    </div>
</template>

<script>
export default {
    data() {
        return {
            lat: "",
            lng: "",
            currentPosition: "",
            currentLat: "",
            currentLng: "",
        };
    },
    methods: {
        s2ab(s) {
            const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
            return buf;
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
        viewKakaoMap() {
            this.waitForKakaoAPI(() => {
                var container = document.getElementById("roadview");
                var roadview = new kakao.maps.Roadview(container);
                let roadviewClient = new kakao.maps.RoadviewClient();
                let position = new kakao.maps.LatLng(this.lat, this.lng);
                console.log("position: ", position.getLat(), position.getLng());
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
                    console.log("currentLat: ", this.currentLat, "currentLng: ", this.currentLng);
                    this.updateKakaoMap();
                });

                // Initialize the first map with a marker
                var initialMapContainer = document.getElementById("initialMap");
                var initialMapOption = {
                    center: position,
                    level: 3,
                };
                var initialMap = new kakao.maps.Map(initialMapContainer, initialMapOption);
                var marker = new kakao.maps.Marker({
                    position: position,
                });
                marker.setMap(initialMap);
            });
        },
        updateKakaoMap() {
            let updatedPosition = new kakao.maps.LatLng(this.currentLat, this.currentLng);
            var updatedMapContainer = document.getElementById("updatedMap");
            var updatedMapOption = {
                center: updatedPosition,
                level: 3,
            };
            var updatedMap = new kakao.maps.Map(updatedMapContainer, updatedMapOption);
            var marker = new kakao.maps.Marker({
                position: updatedPosition,
            });
            marker.setMap(updatedMap);
        },
        showCurrentPosition() {
            var container = document.getElementById("roadview");
            var roadview = new kakao.maps.Roadview(container);
            kakao.maps.event.addListener(roadview, "panoid_changed", () => {
                console.log(roadview.getPosition().toString());
                this.currentLat = roadview.getPosition().toString().split()[0];
                this.currentLng = roadview.getPosition().toString().split()[1];
                this.currentPosition = `현재 좌표는 위도 ${this.currentLat}, 경도 ${this.currentLng} 입니다.`;
                this.updateKakaoMap();
            });
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
#roadview,
#initialMap,
#updatedMap {
    width: 100%;
    height: 300px;
    margin-top: 10px;
}
</style>
