<template>
  <div class="road-view-practice">
    <!-- Google AdSense 광고 (헤더 위) -->
    <div class="top-ads-container">
      <Adsense :ad-slot="'6033902133'" @ad-loaded="onAdLoaded" />
    </div>

    <!-- 헤더 -->
    <div class="game-header" :style="{ top: headerTop }">
      <button class="back-btn" @click="exitGame">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2 v-if="!gameStarted">{{ selectedRegion.name }} 연습 모드</h2>
      <div class="poi-header" v-if="poiName">
        <i class="fas fa-map-marker-alt"></i>
        <span class="poi-text" :title="poiName">{{ poiName }}</span>
      </div>
      <div v-else class="poi-header placeholder">
        <i class="fas fa-map-marker-alt"></i>
        <span class="poi-text">지명 불러오는 중...</span>
      </div>
      <div v-if="gameStarted" class="game-status">
        <!-- 랭크 모드 타이머 -->
        <div
          v-if="isRankMode"
          class="timer"
          :class="{ warning: timeRemaining <= 30 }"
        >
          <i class="fas fa-clock"></i>
          <span>{{ formatTime(timeRemaining) }}</span>
        </div>

        <!-- 연습 모드 힌트 -->
        <div v-else class="hints">
          <div
            v-for="n in 3"
            :key="`hint-${n}`"
            class="hint-indicator"
            :class="{ active: n <= hintsLeft }"
          >
            <i class="fas fa-lightbulb"></i>
          </div>
          <div v-if="!hintAvailable && hintsLeft > 0" class="hint-timer">
            {{ nextHintTime }}초
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 게임 영역 -->
    <div class="game-content">
      <!-- 로드뷰 화면 -->
      <div class="road-view-container">
        <RoadViewGame
          v-if="currentLocation"
          ref="roadViewGameRef"
          :initialPosition="currentLocation"
          :showControls="false"
          :showCompass="false"
          :preventInteraction="false"
          @load-complete="onRoadViewLoaded"
          @load-error="onRoadViewError"
        />

        <!-- 초기 위치로 돌아가기 버튼 (헤더 바로 밑, 우측 상단) -->
        <button
          v-if="currentLocation && !showResult"
          class="road-reset-btn"
          :style="{ top: resetBtnTop }"
          @click="resetRoadViewPosition"
          title="초기 위치로 돌아가기"
        >
          <i class="fas fa-rotate-right"></i>
        </button>

        <!-- 지도 버튼 -->
        <button class="map-toggle" @click="toggleMap">
          <i
            class="fas"
            :class="isMapOpen ? 'fa-street-view' : 'fa-map-marked-alt'"
          ></i>
          {{ isMapOpen ? "로드뷰로 돌아가기" : "지도 열기" }}
        </button>
      </div>

      <!-- 휴대폰 프레임 -->
      <PhoneFrame
        :showReloadButton="isMapOpen && !showResult"
        :style="{ zIndex: isMapOpen ? 21 : -1 }"
        :centerLocation="{ lat: 36.5, lng: 127.5 }"
        :showHintCircles="false"
        :disabled="showResult"
        :showDistance="false"
        :showActionButton="false"
        :gameMode="'single'"
        :markerImageUrl="markerImageUrl"
        @close="toggleMap"
        @check-answer="checkAnswer"
        @spot-answer="checkSpotAnswer"
        @error="showToastMessage"
        ref="phoneFrame"
      >
        <template v-slot:buttons>
          <!-- 힌트 버튼 (휴대폰 프레임 내부) -->
          <button
            v-if="!showResult"
            class="phone-hint-button"
            @click="useHint"
            :disabled="!hintAvailable || hintCount <= 0"
          >
            <i class="fas fa-lightbulb"></i>
            <span v-if="hintCount > 0 && !hintAvailable"
              >{{ nextHintTime }}초 후 사용 가능</span
            >
            <span v-else>힌트 사용 ({{ hintCount }}/3)</span>
          </button>
        </template>
      </PhoneFrame>

      <!-- 인트로 화면 -->
      <IntroOverlay
        :showIntro="showIntro"
        :gameTitle="gameTitle"
        :gameContent="gameContent"
        :gameDescription="gameDescription"
        @end-intro="endIntro"
      />

      <!-- 카운트다운 화면 -->
      <CountdownOverlay
        :show="showCountdown"
        :initial-count="3"
        @countdown-complete="onCountdownComplete"
      />

      <PracticeResultOverlay
        v-if="showResult && !isSharedRecipientMode"
        :show="showResult"
        :distance="distance"
        :score="score"
        :poiName="poiName"
        :fullAddress="fullAddress"
        :currentLocation="currentLocation"
        :guessedLocation="guessedLocation"
        :markerImageUrl="markerImageUrl"
        :shareLoading="isShareLoading"
        :shareButtonText="isShareCopied ? '복사완료!' : '게임 공유'"
        @share="shareGame"
        @restart="nextRound"
        @exit="exitGame"
      />

      <SharedPracticeResultOverlay
        v-if="showResult && isSharedRecipientMode"
        :show="showResult"
        :sharerNickname="sharedSource.nickname"
        :sharerScore="sharedSource.score"
        :sharerHintsUsed="sharedSource.hintsUsed"
        :myScore="score"
        :myHintsUsed="usedHints"
        :currentLocation="currentLocation"
        :guessedLocation="guessedLocation"
        :markerImageUrl="markerImageUrl"
        @login="goToLogin"
        @restart="nextRound"
      />

      <!-- 종료 확인 모달 -->
      <div v-if="showExitConfirmation" class="modal-overlay">
        <div class="modal-content">
          <h3>게임 종료</h3>
          <p>정말 게임을 종료하시겠습니까?</p>
          <div class="modal-buttons">
            <button class="cancel-btn" @click="showExitConfirmation = false">
              취소
            </button>
            <button class="confirm-btn" @click="confirmExit">확인</button>
          </div>
        </div>
      </div>

      <!-- 로드뷰 토스트 메시지 -->
      <div class="toast-message" v-if="showToast">
        {{ toastMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import RoadViewGame from "src/features/game/single/roadview/components/gameplay/RoadViewGame.vue";
import PhoneFrame from "src/features/game/shared/components/Phone/PhoneFrame.vue";
import CountdownOverlay from "@/features/game/shared/components/Common/CountdownOverlay.vue";
import IntroOverlay from "@/features/game/shared/components/Common/IntroOverlay.vue";
import Adsense from "@/features/game/shared/components/Common/Adsense.vue";
import { roadViewApiService } from "src/features/game/single/roadview/services/roadViewApi.service.js";
import PracticeResultOverlay from "src/features/game/single/roadview/components/Result/PracticeResultOverlay.vue";
import SharedPracticeResultOverlay from "src/features/game/single/roadview/components/Result/SharedPracticeResultOverlay.vue";

export default {
  name: "RoadViewPractice",
  components: {
    RoadViewGame,
    PhoneFrame,
    CountdownOverlay,
    IntroOverlay,
    Adsense,
    PracticeResultOverlay,
    SharedPracticeResultOverlay,
  },
  props: {
    isRankMode: {
      type: Boolean,
      default: false,
    },
    region: {
      type: String,
      default: "서울",
    },
  },
  data() {
    return {
      //인트로 관련
      gameTitle: "로드뷰 연습게임",
      gameContent: "현재 보이는 로드뷰의 위치를 지도에서 찾아보세요.",
      gameDescription:
        '지도를 열고 위치를 클릭한 후 "위치 선택" 버튼을 눌러 정답을 확인하세요.',

      // 게임 화면 관련
      isMapOpen: false,
      showExitConfirmation: false,
      showResult: false,
      showToast: false,
      toastMessage: "",
      toastTimeout: null,

      // 게임 상태 관련
      isFirstRun: true,
      isLoading: true,
      currentLocation: null,
      guessedLocation: null,
      errorCount: 0, // 로드뷰 로드 오류 카운트
      maxErrorRetry: 3, // 최대 재시도 횟수

      // API 관련
      gameId: null, // 백엔드에서 받은 게임 ID (Number)
      markerImageUrl: null, // 마커 이미지 URL
      currentSidoKey: null, // 현재 선택된 sido key (API 호출 시 사용)
      gameStartTime: null, // 게임 시작 시간 (타임스탬프)
      poiName: null, // 정답 위치의 POI 이름 (백엔드에서 받음)
      fullAddress: null, // 전체 주소 (시도, 시군구, 동 포함)

      // 게임 점수 관련
      distance: null,
      score: 0,
      elapsedTime: 0, // 게임 경과 시간 (초)

      // 지도 관련
      centerLocation: {
        lat: 37.55,
        lng: 126.97,
      },

      // 지역 데이터
      regions: [
        { id: "seoul", name: "서울", centerLat: 37.5665, centerLng: 126.978 },
        { id: "busan", name: "부산", centerLat: 35.1796, centerLng: 129.0756 },
        { id: "jeju", name: "제주", centerLat: 33.4996, centerLng: 126.5312 },
        {
          id: "gangwon",
          name: "강원",
          centerLat: 37.8228,
          centerLng: 128.1555,
        },
        {
          id: "gyeonggi",
          name: "경기",
          centerLat: 37.4138,
          centerLng: 127.5183,
        },
      ],

      // 백엔드 sido key를 한글 지역명으로 변환하는 매핑
      sidoKeyToRegionNameMapping: {
        SEOUL: "서울",
        BUSAN: "부산",
        DAEGU: "대구",
        INCHEON: "인천",
        GWANGJU: "광주",
        DAEJEON: "대전",
        ULSAN: "울산",
        SEJONG: "세종",
        GYEONGGI: "경기",
        GANGWON: "강원",
        CHUNGBUK: "충북",
        CHUNGNAM: "충남",
        JEONBUK: "전북",
        JEONNAM: "전남",
        GYEONGBUK: "경북",
        GYEONGNAM: "경남",
        JEJU: "제주",
      },
      selectedRegion: {
        name: "서울",
        bounds: {
          sw: { lat: 37.41, lng: 126.79 },
          ne: { lat: 37.7, lng: 127.17 },
        },
      },

      // 로드뷰 게임 상태
      showIntro: true,
      showCountdown: false,
      gameStarted: false,

      // 힌트 관련
      hintsLeft: 3,
      hintCount: 3, // 힌트 사용 가능 횟수
      hintCircle: null, // 힌트 원 객체
      hintRadius: 50000, // 초기 힌트 원 반경 (미터) - 60km
      hintAvailable: false, // 힌트 사용 가능 여부
      nextHintTime: 30, // 다음 힌트까지 남은 시간 (초)
      hintTimer: null, // 힌트 타이머

      // 광고 관련
      hasAd: false, // 광고 표시 여부

      // 공유 게임 관련
      isSharedRecipientMode: false,
      isShareLoading: false,
      isShareCopied: false,
      shareCopiedResetTimer: null,
      isComponentActive: true,
      sharedSource: {
        nickname: "공유 플레이어",
        score: 0,
        hintsUsed: 0,
      },
      sharedTargetLocation: null,

      // TODO: 백엔드 endPracticeGame 응답에 nickname 필드 추가 시 이 값을 사용
      // API 응답(endGameWithApi)에서 받아온 플레이어 닉네임. 없으면 null.
      playerNickname: null,
    };
  },
  computed: {
    // 헤더 위치 계산
    headerTop() {
      return this.hasAd ? "90px" : "0";
    },
    // reset 버튼 위치 계산 (헤더 바로 밑)
    resetBtnTop() {
      // 광고(90px) + 헤더(56px) + 여백(12px) = 158px (광고 있을 때)
      // 헤더(56px) + 여백(12px) = 68px (광고 없을 때)
      return this.hasAd ? "158px" : "68px";
    },
    usedHints() {
      return 3 - this.hintCount;
    },
  },
  mounted() {
    const shareToken = this.$route.query.shareToken;
    if (shareToken) {
      this.initializeSharedMode(shareToken);
      return;
    }

    // 쿼리 파라미터에서 sido key 받기
    const sidoKey = this.$route.query.sido;

    if (sidoKey) {
      // sido key로부터 지역 정보 설정
      const regionName = this.sidoKeyToRegionNameMapping[sidoKey];
      if (regionName) {
        // sido key를 데이터에 저장 (API 호출 시 사용)
        this.currentSidoKey = sidoKey;

        // 지역 이름으로 selectedRegion 설정
        const matchedRegion = this.regions.find((r) => r.name === regionName);
        if (matchedRegion) {
          this.selectedRegion = matchedRegion;
        } else {
          // 매칭되지 않으면 기본값 설정
          this.selectedRegion = {
            id: sidoKey.toLowerCase(),
            name: regionName,
            centerLat: 37.5665,
            centerLng: 126.978,
          };
        }

        // 게임 제목을 지역명으로 업데이트
        this.gameTitle = `${regionName} 로드뷰 연습게임`;
      } else {
        console.warn("알 수 없는 sido key:", sidoKey);
        this.selectedRegion = this.regions[0]; // 기본값: 서울
        this.currentSidoKey = "SEOUL";
        this.gameTitle = "서울 로드뷰 연습게임";
      }
    } else {
      // props에서 region이 전달된 경우 (기존 로직 유지)
      this.selectedRegion =
        this.regions.find((r) => r.id === this.region.toLowerCase()) ||
        this.regions[0];

      // props 기반으로 sido key 설정 (폴백용)
      this.currentSidoKey = "SEOUL"; // 기본값

      // 게임 제목을 지역명으로 업데이트
      this.gameTitle = `${this.selectedRegion.name} 로드뷰 연습게임`;
    }

    // 게임 위치 데이터는 실제 "시작하기" 클릭 시 로드 (endIntro에서 호출)
  },
  beforeUnmount() {
    this.isComponentActive = false;
    this.clearAllTimers();
    this.clearShareCopiedTimer();
    this.clearToastTimer();
  },
  methods: {
    // 로드뷰 초기 위치로 돌아가기
    resetRoadViewPosition() {
      if (
        this.$refs.roadViewGameRef &&
        this.$refs.roadViewGameRef.resetToInitial
      ) {
        this.$refs.roadViewGameRef.resetToInitial();
      }
    },

    // 광고 로드 상태 업데이트
    onAdLoaded(hasAd) {
      this.hasAd = hasAd;
    },

    // 게임 시작
    async endIntro() {
      this.showIntro = false;
      this.showCountdown = true;

      // 공유 링크 진입 시에는 API 재요청 대신 공유된 좌표를 그대로 사용합니다.
      if (this.isSharedRecipientMode && this.sharedTargetLocation) {
        try {
          const response = await roadViewApiService.startSharedPracticeGame(
            this.$route.query.shareToken,
          );
          if (
            response?.isSuccess &&
            response.result?.targetLat &&
            response.result?.targetLng
          ) {
            this.currentLocation = {
              lat: roadViewApiService.decryptCoordinate(
                response.result.targetLat,
              ),
              lng: roadViewApiService.decryptCoordinate(
                response.result.targetLng,
              ),
            };
            this.gameId = roadViewApiService.convertGameIdToNumber(
              response.result.gameId,
            );
          } else {
            this.currentLocation = { ...this.sharedTargetLocation };
          }
        } catch (error) {
          this.currentLocation = { ...this.sharedTargetLocation };
        }

        this.$nextTick(() => {
          if (this.$refs.phoneFrame) {
            this.$refs.phoneFrame.ensureMapInitialized();
          }
        });
        return;
      }

      this.fetchGameLocationData();
    },

    initializeSharedMode(shareToken) {
      const parsedPayload = this.parseShareToken(shareToken);
      if (!parsedPayload || !parsedPayload.location) {
        this.showToastMessage("유효하지 않은 공유 링크입니다.");
        this.$router.replace({
          path: "/roadView/practice",
          query: { sido: "SEOUL" },
        });
        return;
      }

      this.isSharedRecipientMode = true;
      this.currentSidoKey = parsedPayload.sido || "SEOUL";
      this.sharedTargetLocation = {
        lat: parsedPayload.location.lat,
        lng: parsedPayload.location.lng,
      };
      this.selectedRegion =
        this.regions.find(
          (region) => region.id === (parsedPayload.regionId || "seoul"),
        ) || this.regions[0];
      this.gameTitle = `${this.selectedRegion.name} 로드뷰 공유게임`;
      this.poiName = parsedPayload.poiName || null;
      this.fullAddress = parsedPayload.fullAddress || null;
      this.sharedSource = {
        nickname: parsedPayload.source?.nickname || "공유 플레이어",
        score: Number(parsedPayload.source?.score || 0),
        hintsUsed: Number(parsedPayload.source?.hintsUsed || 0),
      };
    },

    parseShareToken(token) {
      try {
        const normalizedToken = token.replace(/-/g, "+").replace(/_/g, "/");
        const decodedText = decodeURIComponent(
          escape(window.atob(normalizedToken)),
        );
        const parsed = JSON.parse(decodedText);
        if (
          !parsed ||
          !parsed.location ||
          Number.isNaN(parsed.location.lat) ||
          Number.isNaN(parsed.location.lng)
        ) {
          return null;
        }
        return parsed;
      } catch (error) {
        console.error("공유 토큰 파싱 실패:", error);
        return null;
      }
    },

    buildShareToken(payload) {
      const encoded = window.btoa(
        unescape(encodeURIComponent(JSON.stringify(payload))),
      );
      return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    },

    async shareGame() {
      if (!this.currentLocation) {
        this.showToastMessage("공유할 게임 데이터가 없습니다.");
        return;
      }

      if (this.isShareLoading) {
        return;
      }

      this.isShareLoading = true;
      try {
        const payload = {
          version: 1,
          regionId: this.selectedRegion?.id || "seoul",
          sido: this.currentSidoKey || "SEOUL",
          location: {
            lat: this.currentLocation.lat,
            lng: this.currentLocation.lng,
          },
          poiName: this.poiName,
          fullAddress: this.fullAddress,
          source: {
            // 우선순위: 1) API 응답 nickname, 2) localStorage, 3) 폴백
            nickname:
              this.playerNickname ||
              localStorage.getItem("nickname") ||
              "익명 플레이어",
            score: this.score,
            hintsUsed: this.usedHints,
          },
        };

        const apiResponse = await roadViewApiService.createPracticeShareLink(
          payload,
        );
        if (!this.isComponentActive) {
          return;
        }
        let shareUrl = apiResponse?.result?.shareUrl;

        if (!shareUrl) {
          const token = this.buildShareToken(payload);
          const routeData = this.$router.resolve({
            path: "/roadView/practice",
            query: { shareToken: token },
          });
          shareUrl = `${window.location.origin}${routeData.href}`;
        }

        await this.copyToClipboard(shareUrl);
        if (!this.isComponentActive) {
          return;
        }
        this.isShareCopied = true;
        this.clearShareCopiedTimer();
        this.shareCopiedResetTimer = setTimeout(() => {
          if (!this.isComponentActive) {
            return;
          }
          this.isShareCopied = false;
          this.shareCopiedResetTimer = null;
        }, 1600);
        this.showToastMessage("링크가 복사되었습니다.");
      } catch (error) {
        if (!this.isComponentActive) {
          return;
        }
        console.error("공유 링크 생성 실패:", error);
        this.isShareCopied = false;
        this.clearShareCopiedTimer();
        this.showToastMessage("링크 복사에 실패했습니다. 다시 시도해주세요.");
      } finally {
        if (this.isComponentActive) {
          this.isShareLoading = false;
        }
      }
    },

    clearShareCopiedTimer() {
      if (this.shareCopiedResetTimer) {
        clearTimeout(this.shareCopiedResetTimer);
        this.shareCopiedResetTimer = null;
      }
    },

    async copyToClipboard(value) {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        return;
      }

      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const isCopied = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (!isCopied) {
        throw new Error("clipboard copy failed");
      }
    },

    // 게임 상태 초기화
    resetGame() {
      // 타이머 정리
      this.clearTimer();
      this.clearShareCopiedTimer();

      // 상태 초기화
      this.showResult = false;
      this.isMapOpen = false;
      this.isShareCopied = false;
      this.guessedLocation = null;
      this.distance = null;
      this.score = 0;
      this.elapsedTime = 0;

      // API 관련 상태 초기화
      this.gameId = null;
      this.markerImageUrl = null;
      this.gameStartTime = null;
      this.poiName = null;
      this.fullAddress = null;
      // currentSidoKey는 쿼리 파라미터에서 온 값이므로 유지

      // 힌트 상태 초기화
      this.hintCount = 3;
      this.hintRadius = 15000; // 초기 힌트 원 반경 (15km)
      this.hintAvailable = false;
      this.nextHintTime = 30;

      // 힌트 원 제거
      if (this.hintCircle) {
        this.hintCircle.setMap(null);
        this.hintCircle = null;
      }

      // 새로운 게임 위치 데이터 요청
      this.fetchGameLocationData();
    },

    // 모든 타이머 정리
    clearAllTimers() {
      // 타이머 정리
      this.clearTimer();
      this.clearToastTimer();
    },

    clearToastTimer() {
      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
        this.toastTimeout = null;
      }
    },

    // 지도 토글
    toggleMap() {
      const wasOpen = this.isMapOpen;
      // 상태 변경 - 이것만으로 인라인 스타일에서 z-index가 변경됨
      this.isMapOpen = !this.isMapOpen;

      if (this.isMapOpen) {
        this.$nextTick(() => {
          // 지도가 초기화되지 않았으면 초기화 시도
          if (this.$refs.phoneFrame) {
            this.$refs.phoneFrame.ensureMapInitialized();
          }

          // 지도가 초기화될 때까지 기다린 후 리사이즈
          setTimeout(() => {
            const mapInstance = this.$refs.phoneFrame.getMapInstance();
            if (mapInstance) {
              mapInstance.relayout();

              // 힌트 원 재표시
              if (this.hintCircle) {
                this.hintCircle.setMap(mapInstance);
              }
            }
          }, 200);
        });
      } else {
        // 지도를 닫을 때는 인라인 스타일에서 자동으로 z-index가 -1로 설정됨
        // hintCircle 객체는 그대로 유지, 다음에 지도가 열렸을 때 다시 표시
      }
    },

    // 힌트 사용
    useHint() {
      if (!this.hintAvailable || this.hintCount <= 0 || !this.currentLocation)
        return;

      // 지도가 열려있지 않으면 먼저 지도를 열기
      if (!this.isMapOpen) {
        this.isMapOpen = true;

        // 지도가 초기화될 때까지 기다린 후 힌트 적용
        setTimeout(() => {
          this.applyHint();
        }, 500);
      } else {
        this.applyHint();
      }
    },

    // 힌트 적용 (지도에 원 표시)
    applyHint() {
      // 맵 컴포넌트가 없는 경우 중단
      if (!this.$refs.phoneFrame) {
        this.showToastMessage(
          "지도를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        );
        return;
      }

      // PhoneFrame 컴포넌트의 getMapInstance() 메서드를 사용하여 맵 인스턴스를 가져옴
      const map = this.$refs.phoneFrame.getMapInstance();
      if (!map) {
        this.showToastMessage(
          "지도를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        );
        return;
      }

      // 힌트 사용 횟수 감소
      this.hintCount--;
      this.hintsLeft = this.hintCount; // hintsLeft와 동기화

      // 기존 힌트 원 제거
      if (this.hintCircle) {
        this.hintCircle.setMap(null);
        this.hintCircle = null;
      }

      // kakao 객체가 정의되어 있는지 확인
      if (typeof kakao === "undefined") {
        console.error("Kakao Maps SDK is not loaded");
        this.showToastMessage("지도를 불러오는 중 오류가 발생했습니다.");
        return;
      }

      // 정답 위치 좌표
      const actualPosition = new kakao.maps.LatLng(
        this.currentLocation.lat,
        this.currentLocation.lng,
      );

      // 랜덤한 원 생성 (정답 위치를 포함하는)
      // 1. 랜덤한 각도 생성 (0-360도)
      const randomAngle = Math.random() * 360;

      // 2. 랜덤한 거리 생성 (0부터 힌트 반경의 70%까지)
      // 힌트 반경의 70%까지만 이동하여 정답이 항상 원 안에 포함되도록 함
      const maxDistance = this.hintRadius * 0.7;
      const randomDistance = Math.random() * maxDistance;

      // 3. 랜덤한 위치 계산 (정답으로부터 랜덤한 각도와 거리만큼 떨어진 지점)
      // 위도 1도 = 약 111km, 경도 1도 = 약 111km * cos(위도)
      const randomLat =
        this.currentLocation.lat +
        (randomDistance / 111000) * Math.cos(this.deg2rad(randomAngle));
      const randomLng =
        this.currentLocation.lng +
        (randomDistance /
          (111000 * Math.cos(this.deg2rad(this.currentLocation.lat)))) *
          Math.sin(this.deg2rad(randomAngle));

      // 랜덤한 원의 중심점
      const circleCenter = new kakao.maps.LatLng(randomLat, randomLng);

      // 힌트 원 생성 (랜덤한 위치에 중심을 둔 원)
      this.hintCircle = new kakao.maps.Circle({
        center: circleCenter,
        radius: this.hintRadius,
        strokeWeight: 2,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeStyle: "dashed",
        fillColor: "#FF0000",
        fillOpacity: 0.2,
        map: map,
      });

      // 힌트 원이 보이도록 지도 이동 (원의 중심으로)

      // map.setCenter(circleCenter);

      // 힌트 반경 조정 (힌트를 사용할 때마다 원이 작아짐)
      if (this.hintCount === 2) {
        this.hintRadius = 5000; // 두 번째 힌트는 5km
      } else if (this.hintCount === 1) {
        this.hintRadius = 1000; // 세 번째 힌트는 1km
      }

      // 다음 힌트 사용 가능 시간 설정
      this.hintAvailable = false;
      this.nextHintTime = 10;

      // 힌트 타이머 재설정
      if (this.hintTimer) {
        clearInterval(this.hintTimer);
      }

      this.hintTimer = setInterval(() => {
        if (this.nextHintTime > 0) {
          this.nextHintTime--;
        } else {
          this.hintAvailable = true;
          clearInterval(this.hintTimer);
        }
      }, 1000);

      // 힌트 사용 메시지 표시
      this.showToastMessage(
        `힌트를 사용했습니다. (남은 힌트: ${this.hintCount}/3)`,
      );
    },

    // 랭크 모드 타이머 시작
    startTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }

      this.timerInterval = setInterval(() => {
        if (this.timeRemaining > 0) {
          this.timeRemaining--;

          // 시간이 다 되면 자동으로 결과 표시
          if (this.timeRemaining === 0) {
            this.timeUp();
          }
        }
      }, 1000);
    },

    // 시간 초과 처리
    timeUp() {
      // 타이머 중지
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }

      // 가장 먼 위치로 마커 자동 설정
      const farthestPosition = {
        lat: this.currentLocation.lat > 36 ? 33.5 : 38.0,
        lng: this.currentLocation.lng > 128 ? 126.0 : 131.0,
      };

      this.checkAnswer(farthestPosition);
    },

    // 시간 형식 변환 (초를 MM:SS 형식으로)
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    },

    // 게임 위치 데이터 가져오기 (백엔드 API 연동)
    async fetchGameLocationData() {
      this.isLoading = true;
      // coordinate를 받을 때까지 로드뷰를 표시하지 않도록 currentLocation 초기화
      this.currentLocation = null;

      // PhoneFrame의 지도 시작 위치는 대한민국 중심으로 고정
      // centerLocation은 PhoneFrame에 직접 전달하지 않으므로 여기서는 설정하지 않음

      try {
        // 현재 설정된 sido key 사용 (쿼리 파라미터에서 받은 값)
        const sido = this.currentSidoKey || "SEOUL";

        // 백엔드 API 호출하여 연습 게임 시작 (최대 5번 재시도)
        const response = await roadViewApiService.startPracticeGame(sido);

        if (response.isSuccess && response.result) {
          const {
            gameId,
            targetLat,
            targetLng,
            markerImageUrl,
            poiName,
            fullAddress,
          } = response.result;

          // 좌표 유효성 검사
          if (!targetLat || !targetLng) {
            throw new Error("좌표 데이터가 유효하지 않습니다.");
          }

          // API 응답 데이터를 컴포넌트 상태에 저장
          // gameId를 숫자로 변환하여 저장 (백엔드 Long 타입)
          this.gameId = roadViewApiService.convertGameIdToNumber(gameId);
          this.markerImageUrl = markerImageUrl;
          this.poiName = poiName || this.poiName || "";
          this.fullAddress = fullAddress || null;

          // 암호화된 좌표를 복호화
          const decryptedLat = roadViewApiService.decryptCoordinate(targetLat);
          const decryptedLng = roadViewApiService.decryptCoordinate(targetLng);

          // 복호화된 좌표 유효성 검사
          if (isNaN(decryptedLat) || isNaN(decryptedLng)) {
            throw new Error("좌표 복호화에 실패했습니다.");
          }

          // coordinate를 확실하게 받은 후에만 currentLocation 설정
          this.currentLocation = {
            lat: decryptedLat,
            lng: decryptedLng,
          };

          console.log(
            "✅ 좌표 수신 완료, 로드뷰 표시 준비:",
            this.currentLocation,
          );

          // currentLocation이 설정된 후 PhoneFrame의 지도 초기화 보장
          this.$nextTick(() => {
            if (this.$refs.phoneFrame) {
              // 지도가 열려있으면 리사이즈, 닫혀있으면 초기화만 보장
              this.$refs.phoneFrame.ensureMapInitialized();

              // 지도가 열려있으면 리사이즈
              if (this.isMapOpen) {
                setTimeout(() => {
                  const mapInstance = this.$refs.phoneFrame.getMapInstance();
                  if (mapInstance) {
                    mapInstance.relayout();
                  }
                }, 100);
              }
            }
          });
        } else {
          throw new Error(response.message || "연습 게임 시작에 실패했습니다.");
        }
      } catch (error) {
        console.error("연습 게임 시작 API 호출 최종 실패:", error);
        // 5번 시도 후 모두 실패한 경우에만 에러 메시지 표시
        this.showToastMessage("게임을 시작할 수 없습니다. 다시 시도해주세요.");

        // API 실패 시 더미 데이터로 폴백
        this.fallbackToDummyData();
      } finally {
        this.isLoading = false;
      }
    },

    // API 실패 시 더미 데이터로 폴백
    fallbackToDummyData() {
      console.warn("더미 데이터로 폴백");

      // 더미 데이터: 로드뷰가 있는 것으로 확인된 좌표들
      const knownLocations = [
        { lat: 37.566826, lng: 126.978656, name: "서울시청" },
        { lat: 37.551229, lng: 126.988205, name: "남산타워" },
        { lat: 37.570975, lng: 126.976999, name: "광화문" },
        { lat: 37.512809, lng: 127.058984, name: "삼성역" },
        { lat: 35.179682, lng: 129.075087, name: "부산 해운대" },
        { lat: 35.158831, lng: 129.160007, name: "부산 광안리" },
        { lat: 35.10146, lng: 129.032364, name: "부산 서면" },
        { lat: 37.456769, lng: 126.705528, name: "인천 송도" },
        { lat: 33.249293, lng: 126.560693, name: "제주 올레길" },
        { lat: 33.4507, lng: 126.570667, name: "제주 시내" },
      ];

      // 지역에 맞는 위치 선택
      let filteredLocations = knownLocations;
      if (this.selectedRegion.id === "seoul") {
        filteredLocations = knownLocations.slice(0, 4);
      } else if (this.selectedRegion.id === "busan") {
        filteredLocations = knownLocations.slice(4, 7);
      } else if (this.selectedRegion.id === "jeju") {
        filteredLocations = knownLocations.slice(8, 10);
      }

      // 필터링된 위치에서 랜덤으로 선택
      const randomIndex = Math.floor(Math.random() * filteredLocations.length);
      const chosen = filteredLocations[randomIndex];
      this.currentLocation = { lat: chosen.lat, lng: chosen.lng };
      this.poiName = chosen.name || this.poiName || "";

      // 더미 게임 ID 생성 (Number 타입)
      this.gameId = Date.now();
      this.markerImageUrl = null;

      console.log("더미 데이터로 선택된 위치:", this.currentLocation);

      // currentLocation이 설정된 후 PhoneFrame의 지도 초기화 보장
      this.$nextTick(() => {
        if (this.$refs.phoneFrame) {
          // 지도가 열려있으면 리사이즈, 닫혀있으면 초기화만 보장
          this.$refs.phoneFrame.ensureMapInitialized();

          // 지도가 열려있으면 리사이즈
          if (this.isMapOpen) {
            setTimeout(() => {
              const mapInstance = this.$refs.phoneFrame.getMapInstance();
              if (mapInstance) {
                mapInstance.relayout();
              }
            }, 100);
          }
        }
      });
    },

    // 게임 결과 확인
    async checkAnswer(position) {
      if (this.showResult) return;

      // 타이머 정리
      this.clearTimer();

      // 거리 계산
      const distance = this.calculateDistance(
        position.lat,
        position.lng,
        this.currentLocation.lat,
        this.currentLocation.lng,
      );

      // 로컬 점수 계산 (임시, 백엔드에서 최종 점수 계산)
      const localScore = Math.max(
        0,
        Math.floor(100 - Math.sqrt(distance) * 10),
      );

      // 게임 결과 저장 (백엔드 API 호출 전 임시 저장)
      this.distance = distance;
      this.guessedLocation = position;

      try {
        // 백엔드 API 호출하여 게임 종료
        await this.endGameWithApi(position);
      } catch (error) {
        console.error("게임 종료 API 호출 실패:", error);
        // API 실패 시 로컬 계산 결과 사용
        this.score = localScore;
        this.showToastMessage("결과 전송에 실패했지만 게임을 계속합니다.");
      }

      // 결과 화면 표시
      this.showResult = true;

      if (this.isSharedRecipientMode) {
        this.showSharedComparison(position, localScore);
      }
    },

    async showSharedComparison(position, localScore) {
      try {
        const payload = {
          gameId: this.gameId,
          shareToken: this.$route.query.shareToken,
          submittedLat: position.lat,
          submittedLng: position.lng,
          answerTime: this.gameStartTime
            ? (Date.now() - this.gameStartTime) / 1000
            : this.elapsedTime,
          hintsUsed: this.usedHints,
        };
        const response = await roadViewApiService.endSharedPracticeGame(
          payload,
        );
        if (response?.isSuccess && response.result) {
          this.sharedSource = {
            nickname:
              response.result.sharerNickname || this.sharedSource.nickname,
            score: Number(
              response.result.sharerScore || this.sharedSource.score,
            ),
            hintsUsed: Number(
              response.result.sharerHintUsedCount ||
                this.sharedSource.hintsUsed,
            ),
          };
          if (typeof response.result.score === "number") {
            this.score = response.result.score;
          }
        } else {
          this.score = localScore;
        }
      } catch (error) {
        console.error("공유 게임 결과 비교 API 실패:", error);
      }
    },

    // 백엔드 API로 게임 종료
    async endGameWithApi(position) {
      if (!this.gameId) {
        console.warn("게임 ID가 없어 API 호출을 건너뜁니다.");
        return;
      }

      try {
        // 답변 소요 시간 계산 (초 단위)
        const answerTime = this.gameStartTime
          ? (Date.now() - this.gameStartTime) / 1000
          : this.elapsedTime;

        const endData = {
          gameId: this.gameId, // Number 타입
          submittedLat: position.lat, // Number 타입
          submittedLng: position.lng, // Number 타입
          answerTime: answerTime, // Number 타입 (초)
        };

        console.log("게임 종료 요청 데이터:", endData);

        const response = await roadViewApiService.endPracticeGame(endData);

        if (response.isSuccess && response.result) {
          const { score, poiName, fullAddress, nickname } = response.result;

          // 백엔드에서 계산된 점수로 업데이트
          this.score = score;

          // POI 이름과 전체 주소 업데이트 (종료 응답에 포함된 경우)
          if (poiName) this.poiName = poiName;
          if (fullAddress) this.fullAddress = fullAddress;

          // TODO: 백엔드 응답에 nickname 필드가 추가되면 여기서 저장됨
          if (nickname) this.playerNickname = nickname;
        } else {
          throw new Error(response.message || "게임 결과 처리에 실패했습니다.");
        }
      } catch (error) {
        console.error("게임 종료 API 호출 중 오류:", error);
        throw error; // 상위에서 처리
      }
    },

    goToLogin() {
      this.$router.push({
        path: "/loginPage",
        query: {
          redirect: this.$route.fullPath,
        },
      });
    },

    // Spot 버튼 클릭 시 마커 위치 확인
    checkSpotAnswer() {
      if (!this.$refs.phoneFrame) {
        alert("지도가 준비되지 않았습니다. 다시 시도해주세요.");
        return;
      }

      // 현재 마커 위치를 얻기 위해 KakaoMapGame에서 마커 위치 데이터 요청
      this.$refs.phoneFrame
        .getMarkerPosition()
        .then((markerPosition) => {
          if (markerPosition) {
            // 지도 닫기
            this.isMapOpen = false;

            // 결과 확인
            this.$nextTick(() => {
              this.checkAnswer(markerPosition);
            });
          } else {
            alert("위치를 선택해주세요!");
          }
        })
        .catch(() => {
          alert("위치를 선택해주세요!");
        });
    },

    // 랭크 모드 타이머 시작
    startGameTimer() {
      this.elapsedTime = 0;

      if (this.gameTimer) {
        clearInterval(this.gameTimer);
      }

      this.gameTimer = setInterval(() => {
        this.elapsedTime++;
      }, 1000);
    },

    // 타이머 정리
    clearTimer() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }

      if (this.gameTimer) {
        clearInterval(this.gameTimer);
        this.gameTimer = null;
      }

      if (this.hintTimer) {
        clearInterval(this.hintTimer);
        this.hintTimer = null;
      }
    },

    // 다음 라운드 시작
    nextRound() {
      this.isComponentActive = false;
      this.isShareCopied = false;
      this.clearShareCopiedTimer();
      // 페이지 새로고침으로 게임을 완전히 초기화
      window.location.reload();
    },

    // 게임 종료
    exitGame() {
      // 타이머 정리
      this.clearTimer();
      this.isComponentActive = false;
      this.isShareCopied = false;
      this.clearShareCopiedTimer();
      this.clearToastTimer();
      this.$router.push("/roadView/main");
    },

    // 게임 종료 확인
    confirmExit() {
      this.$router.push("/roadView/main");
    },

    // 지역 선택 변경
    changeRegion(region) {
      this.selectedRegion = region;
      this.resetGame();
      this.fetchGameLocationData();
    },

    // 로드뷰 로드 완료 이벤트 핸들러
    onRoadViewLoaded(data) {
      this.errorCount = 0; // 에러 카운트 초기화
    },

    // 로드뷰 로드 오류 이벤트 핸들러
    async onRoadViewError() {
      console.error("로드뷰 로드 오류, 좌표 재발급 시도");
      this.errorCount++;

      if (this.isSharedRecipientMode) {
        this.showToastMessage(
          "공유 게임 좌표에서 로드뷰를 찾을 수 없습니다. 지도 모드로 전환합니다.",
        );
        this.isMapOpen = true;
        return;
      }

      // gameId가 있으면 재발급 API 호출 (최대 5번 재시도)
      if (this.gameId) {
        try {
          this.showToastMessage(
            "로드뷰를 찾을 수 없어 새로운 좌표를 요청합니다...",
          );

          // coordinate를 받을 때까지 로드뷰를 표시하지 않도록 currentLocation 초기화
          this.currentLocation = null;

          // 최대 5번 재시도하는 reissueCoordinate 호출
          const response = await roadViewApiService.reissueCoordinate(
            this.gameId,
          );

          if (response.isSuccess && response.result) {
            const { targetLat, targetLng } = response.result;

            // 좌표 유효성 검사
            if (!targetLat || !targetLng) {
              throw new Error("좌표 데이터가 유효하지 않습니다.");
            }

            // 암호화된 좌표를 복호화
            const decryptedLat =
              roadViewApiService.decryptCoordinate(targetLat);
            const decryptedLng =
              roadViewApiService.decryptCoordinate(targetLng);

            // 복호화된 좌표 유효성 검사
            if (isNaN(decryptedLat) || isNaN(decryptedLng)) {
              throw new Error("좌표 복호화에 실패했습니다.");
            }

            // coordinate를 확실하게 받은 후에만 currentLocation 설정
            this.currentLocation = {
              lat: decryptedLat,
              lng: decryptedLng,
            };

            // currentLocation이 설정된 후 PhoneFrame의 지도 초기화 보장
            this.$nextTick(() => {
              if (this.$refs.phoneFrame) {
                this.$refs.phoneFrame.ensureMapInitialized();

                if (this.isMapOpen) {
                  setTimeout(() => {
                    const mapInstance = this.$refs.phoneFrame.getMapInstance();
                    if (mapInstance) {
                      mapInstance.relayout();
                    }
                  }, 100);
                }
              }
            });

            this.errorCount = 0; // 성공 시 에러 카운트 초기화
            this.showToastMessage("새로운 좌표로 로드뷰를 다시 시도합니다.");
          } else {
            throw new Error(response.message || "좌표 재발급에 실패했습니다.");
          }
        } catch (error) {
          console.error("좌표 재발급 최종 실패 (5회 시도):", error);

          // 5번 시도 후 모두 실패한 경우에만 에러 처리
          if (this.errorCount > this.maxErrorRetry) {
            this.showToastMessage(
              "로드뷰를 찾을 수 없어 지도 모드로 전환합니다.",
            );
            this.isMapOpen = true;
          } else {
            this.showToastMessage(
              `로드뷰 로드 실패 (${this.errorCount}/${this.maxErrorRetry}), 새 위치를 시도합니다...`,
            );
            this.fetchGameLocationData();
          }
        }
      } else {
        // gameId가 없으면 기존 로직 사용
        if (this.errorCount > this.maxErrorRetry) {
          this.showToastMessage(
            "로드뷰를 찾을 수 없어 지도 모드로 전환합니다.",
          );
          this.isMapOpen = true;
        } else {
          this.showToastMessage(
            `로드뷰 로드 실패 (${this.errorCount}/${this.maxErrorRetry}), 새 위치를 시도합니다...`,
          );
          this.fetchGameLocationData();
        }
      }
    },

    // 토스트 메시지 표시
    showToastMessage(message) {
      if (!this.isComponentActive) {
        return;
      }

      this.clearToastTimer();

      this.toastMessage = message;
      this.showToast = true;

      this.toastTimeout = setTimeout(() => {
        if (!this.isComponentActive) {
          return;
        }
        this.showToast = false;
        this.toastTimeout = null;
      }, 3000);
    },

    // 거리 계산 (Haversine 공식)
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // 지구 반경 (km)
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) *
          Math.cos(this.deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // 킬로미터 단위
    },

    // 각도를 라디안으로 변환
    deg2rad(deg) {
      return deg * (Math.PI / 180);
    },

    // 카운트다운 완료 이벤트 핸들러
    onCountdownComplete() {
      this.showCountdown = false;
      this.gameStarted = true;

      // 게임 시작 시간 기록 (답변 시간 계산용)
      this.gameStartTime = Date.now();

      // 게임 타이머 시작
      this.startGameTimer();

      // 힌트 타이머 시작 (첫 힌트는 30초 후에 사용 가능)
      // this.nextHintTime = 30;
      this.nextHintTime = 3;
      this.hintAvailable = false;

      if (this.hintTimer) {
        clearInterval(this.hintTimer);
      }

      this.hintTimer = setInterval(() => {
        if (this.nextHintTime > 0) {
          this.nextHintTime--;
        } else {
          this.hintAvailable = true;
          clearInterval(this.hintTimer);
        }
      }, 1000);
    },

    // PhoneFrame 내부 지도 재로딩
    reloadPhoneMap(showToast = true) {
      if (!this.$refs.phoneFrame) {
        if (showToast) {
          this.showToastMessage("지도가 준비되지 않았습니다.");
        }
        return;
      }

      try {
        this.$refs.phoneFrame.reloadMap();
        if (showToast) {
          this.showToastMessage("지도를 재로딩합니다...");
        }
      } catch (error) {
        console.error("지도 재로딩 실패:", error);
        if (showToast) {
          this.showToastMessage(
            "지도 재로딩에 실패했습니다. 다시 시도해주세요.",
          );
        }
      }
    },
  },
};
</script>

<style scoped>
.road-view-practice {
  position: relative;
  width: 100%;
  /* 모바일 브라우저 주소창 변동 대응 */
  min-height: 100svh;
  min-height: 100dvh;
  height: 100dvh;
  background-color: #f5f5f5;
  overflow: hidden;
}

/* 상단 광고 컨테이너 */
.top-ads-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 15;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-xs) 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 헤더 스타일 */
.game-header {
  position: absolute;
  /* top은 동적으로 바인딩됨 */
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  backdrop-filter: blur(5px);
  transition: top 0.3s ease;
  /* 헤더 높이 (reset-btn 위치 계산용) */
  height: 56px;
  box-sizing: border-box;
}

/* 초기 위치로 돌아가기 버튼 (헤더 바로 밑, 우측 상단) */
.road-reset-btn {
  position: absolute;
  /* 헤더 바로 밑에 위치 (광고 유무에 따라 동적 계산 필요) */
  top: 68px; /* 기본: 헤더 높이(56px) + 여백(12px) */
  right: 12px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  cursor: pointer;
  z-index: 100;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.road-reset-btn:hover {
  transform: translateY(-1px);
  background: rgba(0, 0, 0, 0.6);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
}

.road-reset-btn i {
  font-size: 1rem;
}

.poi-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.12);
  padding: 6px 10px;
  border-radius: 12px;
}

.poi-header.placeholder {
  opacity: 0.8;
}

.poi-header i {
  color: #ff6b6b;
}

.poi-text {
  color: #fff;
  font-weight: 600;
  max-width: 40vw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.back-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.game-status {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 타이머 스타일 */
.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 6px 12px;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  transition: background-color 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.timer-warning {
  background-color: rgba(255, 50, 50, 0.8);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* 힌트 스타일 */
.hints {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hint-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hint-indicator.active {
  background-color: #2ecc71;
}

.hint-timer {
  font-size: 0.85rem;
  opacity: 0.9;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 4px 8px;
  border-radius: 10px;
}

/* 게임 컨테이너 */
.game-content {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 로드뷰 컨테이너 */
.road-view-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

/* 지도 토글 버튼 스타일 */
.map-toggle {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 10;
}

.map-toggle:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
}

.map-toggle:active {
  transform: translateY(-1px);
}

.map-toggle i {
  font-size: 1.1rem;
}

/* 모달 */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 30;
  backdrop-filter: blur(5px);
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  animation: popIn 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 25px;
}

.modal-buttons button {
  padding: 10px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.modal-buttons button:first-child {
  background-color: #ecf0f1;
  color: #333;
}

.modal-buttons button:first-child:hover {
  background-color: #bdc3c7;
}

.modal-buttons button:last-child {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.modal-buttons button:last-child:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(231, 76, 60, 0.4);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
}

@media (max-width: 768px) {
  .top-ads-container {
    padding: var(--spacing-xs) 0;
  }
}

@media (max-width: 480px) {
  .top-ads-container {
    padding: 4px 0;
  }

  .game-header {
    padding: 10px;
    /* top은 동적으로 바인딩됨 */
  }

  .game-status {
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
  }

  .map-toggle {
    padding: 10px 15px;
    font-size: 0.9rem;
    bottom: 20px;
    right: 20px;
  }
}

/* 로드뷰 토스트 메시지 */
.toast-message {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  z-index: 35;
  max-width: 80%;
  text-align: center;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.phone-hint-button {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(255, 152, 0, 0.4);
  transition: all 0.3s ease;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 180px;
  text-align: center;
  justify-content: center;
}

.phone-hint-button:hover:not(:disabled) {
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 6px 12px rgba(255, 152, 0, 0.6);
}

.phone-hint-button:active:not(:disabled) {
  transform: translateX(-50%) translateY(-1px);
}

.phone-hint-button:disabled {
  background: linear-gradient(135deg, #ccc, #999);
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.8;
}

.phone-hint-button i {
  font-size: 0.9rem;
}
</style>
