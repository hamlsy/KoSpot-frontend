<template>
    <div>
      <input type="file" @change="handleFileUpload" />
      <h1>좌표를 입력하세요</h1>
    <!--위도  -->
    <input type="text" v-model="lat" placeholder="위도" /> 
    <!-- 경도 -->
    <input type="text" v-model="lng" placeholder="경도" />
      <div id="roadview"></div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        lat: "",
        lng: "",    
      };
    },
    methods: {
      
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
  .roadview {
    width: 100%;
    height: 300px;
  }
  
  </style>
  