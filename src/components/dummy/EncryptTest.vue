<template>
  <div>
    <h1>Encrypt Test</h1>
    <input v-model="inputValue" placeholder="Enter value to encrypt" />
    <button @click="decryptAES">Encrypt!</button>
    <p>Encrypted Result: {{ encryptedValue }}</p>
  </div>
</template>
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.js"></script>
<script>
import CryptoJS from "crypto-js";

export default {
  data() {
    return {
      inputValue: "",
      encryptedValue: "",
      secretKey: "0123456789abcdef",
    };
  },
  methods: {
    decryptAES() {
      const encryptedText = this.inputValue;
      // 1. Base64 디코딩
      const encryptedWords = CryptoJS.enc.Base64.parse(encryptedText);

      // 2. 키를 WordArray로 변환
      const keyWords = CryptoJS.enc.Utf8.parse(this.secretKey);

      // 3. 복호화 수행
        const decrypted = CryptoJS.AES.decrypt(
          { ciphertext: encryptedWords },
          keyWords,
          {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
          }
        );
      this.encryptedValue = decrypted.toString(CryptoJS.enc.Utf8);
      console.log(this.encryptedValue);
    },
  },
};
</script>

<style scoped>
/* Add your styles here */
</style>
