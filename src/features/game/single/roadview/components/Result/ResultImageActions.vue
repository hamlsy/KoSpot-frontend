<template>
  <div class="image-actions-wrap">
    <!-- 액션 버튼 행 -->
    <div class="action-btn-row">
      <!-- 결과 복사 (PC 전용) -->
      <button v-if="!isMobile" class="action-btn action-btn--copy" :class="{ 'action-btn--done': copyDone }"
        :disabled="isCapturing" @click="handleCopy" title="결과 이미지 복사">
        <i :class="copyDone ? 'fas fa-check' : 'fas fa-copy'"></i>
        <span>{{ copyDone ? '복사됨' : '결과 복사' }}</span>
      </button>

      <!-- 사진 저장 -->
      <button class="action-btn action-btn--save" :disabled="isCapturing" @click="handleSave" title="결과 이미지 저장">
        <i class="fas fa-download"></i>
        <span>결과 저장</span>
      </button>

      <!-- 공유 버튼 -->
      <button class="action-btn action-btn--share" @click.stop="toggleSharePanel" title="SNS 공유">
        <i class="fas fa-paper-plane"></i>
        <span>공유하기</span>
      </button>
    </div>

    <!-- 캡처 중 로딩 -->
    <div v-if="isCapturing" class="capture-loading">
      <i class="fas fa-circle-notch fa-spin"></i>
      <span>이미지 생성 중...</span>
    </div>

    <!-- SNS 공유 드롭업 패널 -->
    <Transition name="panel-slide">
      <div v-if="showSharePanel" class="share-panel" @click.stop>
        <div class="share-panel-header">
          <span>공유하기</span>
          <button class="close-btn" @click="showSharePanel = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="share-options">
          <!-- 기기 공유 (Web Share API - 모바일 우선) -->
          <button v-if="supportsWebShare" class="share-option-btn share-option-btn--device" @click="handleWebShare">
            <div class="share-icon-wrap share-icon-wrap--device">
              <i class="fas fa-share-from-square"></i>
            </div>
            <span>기기 공유</span>
          </button>

          <!-- X (트위터) -->
          <button class="share-option-btn share-option-btn--twitter" @click="shareToTwitter">
            <div class="share-icon-wrap share-icon-wrap--twitter">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                <path
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.732-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <span>X (트위터)</span>
          </button>

          <!-- 카카오톡 -->
          <button class="share-option-btn share-option-btn--kakao" @click="shareToKakao">
            <div class="share-icon-wrap share-icon-wrap--kakao">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="16" height="16">
                <path
                  d="M12 3C6.477 3 2 6.477 2 10.5c0 2.685 1.645 5.025 4.125 6.374L5.25 20.25l4.077-2.178A10.6 10.6 0 0012 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
              </svg>
            </div>
            <span>카카오톡</span>
          </button>

          <!-- 인스타그램 -->
          <button class="share-option-btn share-option-btn--instagram" @click="handleInstagram">
            <div class="share-icon-wrap share-icon-wrap--instagram">
              <i class="fab fa-instagram"></i>
            </div>
            <span>인스타그램</span>
          </button>

          <!-- 페이스북 -->
          <button class="share-option-btn share-option-btn--facebook" @click="shareToFacebook">
            <div class="share-icon-wrap share-icon-wrap--facebook">
              <i class="fab fa-facebook-f"></i>
            </div>
            <span>페이스북</span>
          </button>

          <!-- 링크 복사 -->
          <button class="share-option-btn share-option-btn--link" :class="{ 'share-option-btn--done': linkCopied }"
            @click="copyLink">
            <div class="share-icon-wrap share-icon-wrap--link">
              <i :class="linkCopied ? 'fas fa-check' : 'fas fa-link'"></i>
            </div>
            <span>{{ linkCopied ? '복사됨!' : '링크 복사' }}</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 패널 외부 클릭 닫기 오버레이 -->
    <div v-if="showSharePanel" class="panel-backdrop" @click="showSharePanel = false"></div>
  </div>
</template>

<script>
import html2canvas from 'html2canvas';



export default {
  name: 'ResultImageActions',
  props: {
    /** 저장 파일명 (확장자 제외) */
    fileName: { type: String, default: 'kospot-result' },
    /** 공유 제목 */
    shareTitle: { type: String, default: 'KoSpot 게임 결과' },
    /** 공유 본문 텍스트 */
    shareText: { type: String, default: 'KoSpot에서 내 결과를 확인해보세요!' },
    /** 정답 위치 좌표 (StaticMap) */
    currentLocation: { type: Object, default: null },
    /** 내가 선택한 위치 좌표 (StaticMap) */
    guessedLocation: { type: Object, default: null },

    /* ── 카드 콘텐츠 props ─────────────────── */
    /** 연습 모드 점수 */
    score: { type: Number, default: null },
    /** 거리 (포맷된 문자열, 예: "1.23 km") */
    distanceText: { type: String, default: '' },
    /** 경과 시간 텍스트 */
    elapsedTimeText: { type: String, default: '' },
    /** 소요시간 표시 여부 */
    showElapsedTime: { type: Boolean, default: false },
    /** 사용한 힌트 개수 */
    hintsUsed: { type: Number, default: 0 },
    /** 정답 장소명 */
    poiName: { type: String, default: '' },
    /** 정답 주소 */
    fullAddress: { type: String, default: '' },
    /* ── 공유 대전 모드 추가 props ─────────── */
    /** 내 점수 (공유 모드) */
    myScore: { type: Number, default: null },
    /** 공유자 점수 */
    sharerScore: { type: Number, default: null },
    /** 공유자 닉네임 */
    sharerNickname: { type: String, default: '' },
    /** 승/패/무 ('win'|'lose'|'tie') */
    comparisonOutcome: { type: String, default: '' },
    /** 공유자 소요시간 (ms) */
    sharerPlaytime: { type: Number, default: 0 },
    /** 공유자 사용 힌트 횟수 */
    sharerHintsUsed: { type: Number, default: 0 },
    /** 내 소요시간 (ms) */
    myPlaytime: { type: Number, default: 0 },
    /** 내 사용 힌트 횟수 */
    myHintsUsed: { type: Number, default: 0 },
  },
  data() {
    return {
      isCapturing: false,
      copyDone: false,
      linkCopied: false,
      showSharePanel: false,
      cachedBlob: null,
    };
  },
  watch: {
    currentLocation() { this.cachedBlob = null; },
    score() { this.cachedBlob = null; },
    myScore() { this.cachedBlob = null; },
  },
  computed: {
    isMobile() {
      return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    },
    supportsWebShare() {
      return typeof navigator.share === 'function';
    },
    pageUrl() {
      return window.location.href;
    },
    /** 공유 대전 모드인지 여부 */
    isSharedMode() {
      return this.sharerNickname !== '' && this.myScore !== null;
    },
  },
  methods: {
    // ─── Off-Screen 캡처 카드 생성 ──────────────────────────────────
    buildOffScreenCard() {
      const CARD_W = 420;
      // 시스템 폰트마다 baseline이 달라 html2canvas에서 텍스트가 아래로 밀리는 현상 방지.
      // 맑은 고딕, 애플-SD 계열 등 한글 폰트를 명시적으로 지정
      const FONT = '"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

      const card = document.createElement('div');
      card.style.cssText = [
        `width:${CARD_W}px`,
        'background:#ffffff',
        'border-radius:22px',
        'overflow:hidden',
        `font-family:${FONT}`,
        'position:fixed',
        'left:-9999px',
        'top:0',
        'z-index:-1',
        'box-sizing:border-box'
      ].join(';');

      // CSS 리셋: html2canvas가 렌더링할 때 영향을 최소화하도록 리셋
      const style = document.createElement('style');
      style.textContent = `
  * { margin:0; padding:0; box-sizing:border-box; line-height:normal; }
  .txt-fix { display: inline-block; transform: translateY(-50%);}
`;
      card.appendChild(style);

      // ① 브랜드 바
      const brandBar = document.createElement('div');
      brandBar.style.cssText = 'height:5px;background:linear-gradient(90deg,#33fbe8 0%,#a5f3f0 60%,#e0fffe 100%);';
      card.appendChild(brandBar);

      // ② 헤더
      const header = document.createElement('div');
      header.style.cssText = 'display:flex;align-items:center;padding:18px 22px 0;';
      const headerIcon = document.createElement('div');
      // 플렉스로 맞추면 아이콘 내부 텍스트도 중앙이 엇나갈 수 있어 padding이나 line-height 미세조정 사용
      headerIcon.style.cssText = 'width:30px;height:30px;border-radius:50%;background:#33fbe8;display:flex;align-items:center;justify-content:center;font-size:0.8rem;flex-shrink:0;margin-right:9px;';
      headerIcon.innerHTML = '<span class="txt-fix" style="font-size:16px;">📍</span>';

      const headerTitle = document.createElement('span');
      headerTitle.style.cssText = 'font-size:0.95rem;font-weight:700;color:#6b7280;letter-spacing:0.02em;';
      headerTitle.innerHTML = `<span class="txt-fix">${this.isSharedMode ? '공유 게임 결과' : '게임 결과'}</span>`;

      header.appendChild(headerIcon);
      header.appendChild(headerTitle);
      card.appendChild(header);

      if (this.isSharedMode) {
        // ── 공유 대전 모드 레이아웃 ──────────────────────────────
        const outcomeColors = { win: '#33fbe8', lose: '#fde68a', tie: '#e5e7eb' };
        const outcomeLabels = { win: '승리! 🎉', lose: '아쉽게 패배', tie: '무승부' };
        const hero = document.createElement('div');
        const oc = this.comparisonOutcome || 'tie';
        hero.style.cssText = `margin:14px 22px;border-radius:18px;padding:20px 16px 16px;text-align:center;border:1.5px solid ${outcomeColors[oc] || '#e5e7eb'};background:#f8fafc;`;

        const heroLabel = document.createElement('p');
        heroLabel.style.cssText = 'margin:0 0 8px;padding:0;font-size:1.3rem;font-weight:800;color:#111827;line-height:1;';
        heroLabel.innerHTML = `<span class="txt-fix">${outcomeLabels[oc] || ''}</span>`;
        hero.appendChild(heroLabel);

        const deltaBadge = document.createElement('div');
        const delta = Number(Math.abs((this.myScore || 0) - (this.sharerScore || 0)).toFixed(2));
        if (delta > 0) {
          deltaBadge.style.cssText = 'display:inline-block;padding:5px 12px 3px;border-radius:999px;font-size:0.75rem;font-weight:700;background:rgba(0,0,0,0.07);color:#111827;line-height:1;';
          deltaBadge.innerHTML = `<span class="txt-fix">${delta}점 차이</span>`;
          hero.appendChild(deltaBadge);
        }
        card.appendChild(hero);

        // VS 점수 비교
        const cmp = document.createElement('div');
        cmp.style.cssText = 'display:grid;grid-template-columns:1fr 36px 1fr;margin:0 22px 16px;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;';

        const formatSecs = (ms) => {
          if (!ms || ms === 0) return '00:00.00';
          const totalSeconds = ms / 1000;
          const mins = Math.floor(totalSeconds / 60);
          const secs = Math.floor(totalSeconds % 60);
          const fract = Math.floor((ms % 1000) / 10);
          return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${fract.toString().padStart(2, '0')}`;
        };

        const makeCard = (name, sc, isMe, playtime, hints) => {
          const c = document.createElement('div');
          c.style.cssText = `padding:18px 12px 14px;text-align:center;background:${isMe ? '#f0fffe' : '#f8fafc'};${isMe ? 'border-left:1px solid #e5e7eb;' : ''}`;
          c.innerHTML = `
            <p style="margin:0 0 10px;padding:0;font-size:0.75rem;font-weight:600;color:#6b7280;line-height:1;"><span class="txt-fix">${name}</span></p>
            <p style="margin:0;padding:0;font-size:2rem;font-weight:800;color:${isMe ? '#0d9488' : '#111827'};line-height:1;"><span class="txt-fix">${sc}</span></p>
            <p style="margin:4px 0 12px;padding:0;font-size:0.75rem;color:#9ca3af;line-height:1;"><span class="txt-fix">점</span></p>
            
            <div style="display:inline-flex;flex-direction:column;gap:4px;width:100%;">
              <div style="background:rgba(0,0,0,0.03);border-radius:6px;padding:6px 4px;font-size:0.65rem;color:#6b7280;line-height:1;display:flex;align-items:center;justify-content:center;">
                <span class="txt-fix" style="font-size:0.7rem;margin-right:3px;">⏱</span>
                <span class="txt-fix">${formatSecs(playtime)}</span>
              </div>
              <div style="background:rgba(0,0,0,0.03);border-radius:6px;padding:6px 4px;font-size:0.65rem;color:#6b7280;line-height:1;display:flex;align-items:center;justify-content:center;">
                <span class="txt-fix" style="font-size:0.7rem;margin-right:3px;">💡</span>
                <span class="txt-fix">힌트 ${hints}회</span>
              </div>
            </div>
          `;
          return c;
        };
        const vsCol = document.createElement('div');
        vsCol.style.cssText = 'display:flex;align-items:center;justify-content:center;background:#fff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;padding-bottom:2px;';
        vsCol.innerHTML = '<span class="txt-fix" style="font-size:0.7rem;font-weight:800;color:#d1d5db;letter-spacing:0.05em;line-height:1;">VS</span>';
        cmp.appendChild(makeCard(this.sharerNickname || '공유자', this.sharerScore ?? 0, false, this.sharerPlaytime, this.sharerHintsUsed));
        cmp.appendChild(vsCol);
        cmp.appendChild(makeCard('나', this.myScore ?? 0, true, this.myPlaytime, this.myHintsUsed));
        card.appendChild(cmp);
      } else {
        // ── 연습 모드 레이아웃 ──────────────────────────────────────
        const scoreHero = document.createElement('div');
        scoreHero.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:24px 22px 8px;';

        const ring = document.createElement('div');
        // line-height 오차를 줄이기 위해 ring 내부도 padding 보정
        ring.style.cssText = 'width:110px;height:110px;border-radius:50%;border:4px solid #33fbe8;background:linear-gradient(135deg,#f0fffe 0%,#ffffff 100%);box-shadow:0 0 0 8px rgba(51,251,232,0.1);display:flex;flex-direction:column;align-items:center;justify-content:center;margin-bottom:14px;padding-top:6px;';
        ring.innerHTML = `<span class="txt-fix" style="font-size:2rem;font-weight:800;color:#111827;line-height:1;margin-bottom:2px;">${this.score ?? 0}</span>
                          <span class="txt-fix" style="font-size:0.8rem;font-weight:600;color:#6b7280;line-height:1;">점</span>`;

        const scoreCap = document.createElement('p');
        scoreCap.style.cssText = 'margin:0;padding:0;font-size:0.82rem;color:#9ca3af;font-weight:500;line-height:1;text-align:center;';
        scoreCap.innerHTML = '<span class="txt-fix">획득 점수</span>';

        scoreHero.appendChild(ring);
        scoreHero.appendChild(scoreCap);
        card.appendChild(scoreHero);

        const statsRow = document.createElement('div');
        statsRow.style.cssText = 'display:flex;align-items:stretch;margin:16px 22px;background:#f0fffe;border:1px solid #b2f5f0;border-radius:14px;overflow:hidden;';
        const makeStat = (icon, val, label) => {
          const s = document.createElement('div');
          s.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;padding:16px 5px 14px;text-align:center;';
          s.innerHTML = `<span class="txt-fix" style="font-size:1.1rem;line-height:1;margin-bottom:8px;">${icon}</span>
                         <span class="txt-fix" style="font-size:0.95rem;font-weight:700;color:#0f766e;line-height:1;margin-bottom:6px;">${val}</span>
                         <span class="txt-fix" style="font-size:0.65rem;color:#6b7280;line-height:1;">${label}</span>`;
          return s;
        };
        const createDivider = () => {
          const d = document.createElement('div');
          d.style.cssText = 'width:1px;background:#b2f5f0;margin:14px 0;flex-shrink:0;';
          return d;
        };

        statsRow.appendChild(makeStat('📏', this.distanceText || '—', '거리'));
        statsRow.appendChild(createDivider());

        if (this.showElapsedTime) {
          statsRow.appendChild(makeStat('⏱', this.elapsedTimeText || '—', '걸린 시간'));

          if (this.hintsUsed > 0) {
            statsRow.appendChild(createDivider());
            statsRow.appendChild(makeStat('💡', `${this.hintsUsed}회`, '사용 힌트'));
          }
        } else {
          statsRow.appendChild(makeStat('🎯', '연습 모드', '게임 유형'));
        }

        card.appendChild(statsRow);
      }

      // ③ 위치 정보 (공통)
      if (this.poiName || this.fullAddress) {
        const loc = document.createElement('div');
        loc.style.cssText = 'margin:0 22px 16px;border-radius:13px;border:1px solid #b2f5f0;overflow:hidden;';

        const locHeader = document.createElement('div');
        // 타이틀이 중앙으로 오도록 flex 컨테이너에 약간의 윗 여백
        locHeader.style.cssText = 'display:flex;align-items:center;padding:10px 14px 9px;background:#f0fffe;border-bottom:1px solid #b2f5f0;font-size:0.78rem;font-weight:600;color:#0f766e;line-height:1;';
        locHeader.innerHTML = '<span class="txt-fix" style="font-size:1rem;">📍</span> <span class="txt-fix" style="margin-left:7px;">정답 위치</span>';

        const locBody = document.createElement('div');
        locBody.style.cssText = 'padding:12px 14px 10px;';
        if (this.poiName) {
          const p = document.createElement('p');
          p.style.cssText = 'margin:0 0 6px;padding:0;font-size:0.95rem;font-weight:700;color:#111827;line-height:1;';
          p.innerHTML = `<span class="txt-fix">${this.poiName}</span>`;
          locBody.appendChild(p);
        }
        if (this.fullAddress) {
          const p = document.createElement('p');
          p.style.cssText = 'margin:0;padding:0;font-size:0.82rem;color:#6b7280;line-height:1;';
          p.innerHTML = `<span class="txt-fix">${this.fullAddress}</span>`;
          locBody.appendChild(p);
        }
        loc.appendChild(locHeader);
        loc.appendChild(locBody);
        card.appendChild(loc);
      }

      // ⑤ KoSpot 워터마크
      const wm = document.createElement('div');
      wm.style.cssText = 'display:flex;align-items:center;justify-content:center;padding:12px 22px 20px;';
      wm.innerHTML = '<span class="txt-fix" style="font-size:0.75rem;font-weight:700;color:#33fbe8;letter-spacing:0.04em;line-height:1;margin-right:6px;">KoSpot</span><span class="txt-fix" style="font-size:0.72rem;color:#d1d5db;line-height:1;">· kospot.kr</span>';
      card.appendChild(wm);

      document.body.appendChild(card);
      return card;
    },

    // ─── 캡처 공통 로직 ──────────────────────────────────────────────
    async captureCard() {
      if (this.cachedBlob) return this.cachedBlob;

      this.isCapturing = true;
      let offScreenCard = null;
      try {
        await document.fonts.ready;

        // ① Off-screen 카드 DOM 생성 (맵 없이)
        offScreenCard = this.buildOffScreenCard();

        // // ② 브라우저가 화면상 레이아웃을 계산할 수 있도록 대기
        // await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        // 카드가 DOM에 붙은 뒤 폰트 적용 + reflow 완료 대기
        await document.fonts.ready;
        offScreenCard.offsetHeight; // 강제 reflow
        await new Promise(r => setTimeout(r, 80));


        // ④ html2canvas로 캡처 (allowTaint: true 유지, useCORS는 true)
        const canvas = await html2canvas(offScreenCard, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          width: offScreenCard.offsetWidth,
          height: offScreenCard.scrollHeight,
          windowWidth: offScreenCard.offsetWidth,
          windowHeight: offScreenCard.scrollHeight,
        });

        return new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              this.cachedBlob = blob;
              resolve(blob);
            } else {
              reject(new Error('이미지 생성 실패'));
            }
          }, 'image/png', 1.0);
        });
      } finally {
        this.isCapturing = false;
        if (offScreenCard && document.body.contains(offScreenCard)) {
          document.body.removeChild(offScreenCard);
        }
      }
    },

    // ─── 결과 복사 (PC 전용) ─────────────────────────────────────────
    async handleCopy() {
      try {
        const blob = await this.captureCard();
        if (!navigator.clipboard || !window.ClipboardItem) {
          this.showToast('이 브라우저에서는 이미지 복사를 지원하지 않습니다.');
          return;
        }
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        this.copyDone = true;
        this.showToast('결과 이미지가 클립보드에 복사되었습니다!');
        setTimeout(() => { this.copyDone = false; }, 2000);
      } catch (err) {
        console.error('이미지 복사 실패:', err);
        this.showToast('이미지 복사에 실패했습니다.');
      }
    },

    // ─── 사진 저장 ───────────────────────────────────────────────────
    async handleSave() {
      try {
        const blob = await this.captureCard();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.fileName}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('사진이 저장되었습니다!');
      } catch (err) {
        console.error('사진 저장 실패:', err);
        this.showToast('사진 저장에 실패했습니다.');
      }
    },

    // ─── 공유 패널 토글 ──────────────────────────────────────────────
    toggleSharePanel() {
      this.showSharePanel = !this.showSharePanel;
    },

    // ─── 기기 공유 (Web Share API) ───────────────────────────────────
    async handleWebShare() {
      this.showSharePanel = false;
      try {
        const blob = await this.captureCard();
        const file = new File([blob], `${this.fileName}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: this.shareTitle, text: this.shareText, files: [file] });
        } else {
          await navigator.share({ title: this.shareTitle, text: this.shareText, url: this.pageUrl });
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('기기 공유 실패:', err);
          this.showToast('공유에 실패했습니다.');
        }
      }
    },

    // ─── X (트위터) 공유 ─────────────────────────────────────────────
    shareToTwitter() {
      this.showSharePanel = false;
      const text = encodeURIComponent(`${this.shareText}\n\n#KoSpot #한국지리`);
      const url = encodeURIComponent(this.pageUrl);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=450');
    },

    // ─── 카카오톡 공유 ────────────────────────────────────────────────
    shareToKakao() {
      this.showSharePanel = false;
      if (!window.Kakao?.isInitialized()) {
        this.showToast('카카오 SDK가 초기화되지 않았습니다.');
        return;
      }
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: this.shareTitle,
            description: this.shareText,
            imageUrl: 'https://kospot.kr/images/icon/kospot_icon_1-removebg.png',
            link: { mobileWebUrl: this.pageUrl, webUrl: this.pageUrl },
          },
          buttons: [{ title: 'KoSpot에서 도전하기', link: { mobileWebUrl: this.pageUrl, webUrl: this.pageUrl } }],
        });
      } catch (err) {
        console.error('카카오 공유 실패:', err);
        this.showToast('카카오 공유에 실패했습니다.');
      }
    },

    // ─── 인스타그램 공유 ──────────────────────────────────────────────
    async handleInstagram() {
      this.showSharePanel = false;
      if (this.isMobile && this.supportsWebShare) {
        await this.handleWebShare();
      } else {
        try {
          await this.handleSave();
          this.showToast('이미지를 저장했습니다. Instagram에서 업로드해주세요!', 3500);
          setTimeout(() => window.open('https://www.instagram.com/', '_blank'), 500);
        } catch {
          this.showToast('이미지 저장 후 Instagram에서 직접 업로드해주세요.');
        }
      }
    },

    // ─── 페이스북 공유 ────────────────────────────────────────────────
    shareToFacebook() {
      this.showSharePanel = false;
      const url = encodeURIComponent(this.pageUrl);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=450');
    },

    // ─── 링크 복사 ───────────────────────────────────────────────────
    async copyLink() {
      try {
        await navigator.clipboard.writeText(this.pageUrl);
        this.linkCopied = true;
        this.showToast('링크가 복사되었습니다!');
        setTimeout(() => { this.linkCopied = false; }, 2000);
      } catch {
        window.prompt('아래 링크를 복사하세요:', this.pageUrl);
      }
    },

    // ─── 토스트 ───────────────────────────────────────────────────────
    showToast(message, duration = 2200) {
      this.$emit('toast', message, duration);
    },
  },
};
</script>

<style scoped>
/* ═══════════════════════════════════════
   래퍼
═══════════════════════════════════════ */
.image-actions-wrap {
  position: relative;
  padding: 0 22px 16px;
}

/* ═══════════════════════════════════════
   액션 버튼 행
═══════════════════════════════════════ */
.action-btn-row {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 10px;
  border: 1.5px solid #e5e7eb;
  background: #f8fafc;
  color: #374151;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  flex: 1;
  justify-content: center;
  min-height: 40px;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn i {
  font-size: 0.85rem;
}

/* 복사 버튼 */
.action-btn--copy:hover:not(:disabled) {
  border-color: #6366f1;
  color: #6366f1;
  background: #eef2ff;
}

.action-btn--copy.action-btn--done {
  border-color: #10b981;
  color: #10b981;
  background: #ecfdf5;
}

/* 저장 버튼 */
.action-btn--save:hover:not(:disabled) {
  border-color: #0d9488;
  color: #0d9488;
  background: #f0fdfa;
}

/* 공유 버튼 */
.action-btn--share:hover:not(:disabled) {
  border-color: #f59e0b;
  color: #d97706;
  background: #fffbeb;
}

/* ═══════════════════════════════════════
   캡처 로딩
═══════════════════════════════════════ */
.capture-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 0.78rem;
  color: #6b7280;
}

/* ═══════════════════════════════════════
   SNS 공유 드롭업 패널
═══════════════════════════════════════ */
.share-panel {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 22px;
  right: 22px;
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 100;
  overflow: hidden;
}

.share-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.85rem;
  font-weight: 700;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 2px 6px;
  font-size: 0.85rem;
  transition: color 0.15s;
}

.close-btn:hover {
  color: #374151;
}

.share-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  padding: 10px 8px 12px;
}

.share-option-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 12px;
  transition: background 0.15s ease, transform 0.15s ease;
  font-size: 0.72rem;
  font-weight: 600;
  color: #374151;
}

.share-option-btn:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.share-option-btn--done {
  color: #10b981;
}

/* 공유 아이콘 원형 래퍼 */
.share-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: transform 0.15s ease;
}

.share-option-btn:hover .share-icon-wrap {
  transform: scale(1.08);
}

/* 플랫폼별 색상 */
.share-icon-wrap--device {
  background: linear-gradient(135deg, #33fbe8, #0d9488);
  color: white;
}

.share-icon-wrap--twitter {
  background: #000000;
  color: white;
}

.share-icon-wrap--kakao {
  background: #FEE500;
  color: #3C1E1E;
}

.share-icon-wrap--instagram {
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  color: white;
}

.share-icon-wrap--facebook {
  background: #1877f2;
  color: white;
}

.share-icon-wrap--link {
  background: #6366f1;
  color: white;
}

/* ═══════════════════════════════════════
   패널 backdrop
═══════════════════════════════════════ */
.panel-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
}

/* ═══════════════════════════════════════
   패널 슬라이드 애니메이션
═══════════════════════════════════════ */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}

/* ═══════════════════════════════════════
   반응형
═══════════════════════════════════════ */
@media (max-width: 360px) {
  .action-btn span {
    display: none;
  }

  .action-btn {
    padding: 9px;
  }
}

@media (max-height: 850px) {
  .image-actions-wrap {
    padding-bottom: 10px;
  }
}
</style>
