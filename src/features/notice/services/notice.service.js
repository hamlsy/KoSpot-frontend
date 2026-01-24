/**
 * Notice API Service
 * 공지사항 CRUD 기능을 위한 백엔드 API 연동 서비스
 * 공지사항 조회, 생성, 수정, 삭제 등의 기능을 제공합니다.
 */
import { apiClient } from '@/core/api/apiClient.js';

/**
 * 공지사항 관련 API 엔드포인트
 */
const NOTICE_ENDPOINTS = {
  // 공지사항 CRUD
  GET_ALL_NOTICES: '/notice',
  GET_NOTICE_BY_ID: (id) => `/notice/${id}`,
  GET_NOTICE_MARKDOWN: (id) => `/notice/${id}/markdown`, // 수정용 마크다운 조회
  CREATE_NOTICE: '/notice',
  UPDATE_NOTICE: (id) => `/notice/${id}`,
  DELETE_NOTICE: (id) => `/notice/${id}`,
  // 공지사항 이미지 업로드
  UPLOAD_NOTICE_IMAGE: '/notice/image',
};

/**
 * 공지사항 목록 응답 데이터 인터페이스
 * @typedef {Object} NoticeListResponse
 * @property {number} noticeId - 공지사항 ID
 * @property {string} title - 공지사항 제목
 * @property {string} createdDate - 생성일 (ISO 8601 format)
 */

/**
 * 공지사항 상세 응답 데이터 인터페이스
 * @typedef {Object} NoticeDetailResponse
 * @property {number} noticeId - 공지사항 ID
 * @property {string} title - 공지사항 제목
 * @property {string} contentHtml - 공지사항 내용 (HTML)
 * @property {string} createdDate - 생성일 (ISO 8601 format)
 */

/**
 * 공지사항 이미지 업로드 응답 데이터 인터페이스
 * @typedef {Object} NoticeImageResponse
 * @property {number} imageId - 이미지 ID
 * @property {string} url - 이미지 URL
 */

/**
 * 공지사항 생성 요청 데이터 인터페이스
 * @typedef {Object} CreateNoticeRequest
 * @property {string} title - 공지사항 제목
 * @property {string} contentMd - 공지사항 내용 (마크다운)
 */

/**
 * 공지사항 수정 요청 데이터 인터페이스
 * @typedef {Object} UpdateNoticeRequest
 * @property {string} title - 공지사항 제목
 * @property {string} contentMd - 공지사항 내용 (마크다운)
 */

/**
 * API 응답 형식
 * @typedef {Object} ApiResponse
 * @property {boolean} isSuccess - 성공 여부
 * @property {number} code - 응답 코드
 * @property {string} message - 응답 메시지
 * @property {*} result - 결과 데이터
 */

/**
 * Notice API Service Class
 */
class NoticeService {
  /**
   * 전체 공지사항 목록 조회
   * @param {number} page - 페이지 번호 (기본값: 0)
   * @returns {Promise<ApiResponse<NoticeListResponse[]>>} API 응답 데이터
   */
  async getAllNotices(page = 0) {
    try {
      console.log('📤 공지사항 목록 조회 요청:', { page });

      const response = await apiClient.get(NOTICE_ENDPOINTS.GET_ALL_NOTICES, {
        params: { page }
      });

      console.log('✅ 공지사항 목록 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 공지사항 목록 조회 실패:', error);
      this._handleApiError(error, '공지사항 목록 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 공지사항 상세 조회
   * @param {number} noticeId - 공지사항 ID
   * @returns {Promise<ApiResponse<NoticeDetailResponse>>} API 응답 데이터
   */
  async getNoticeById(noticeId) {
    try {
      console.log('📤 공지사항 상세 조회 요청:', noticeId);

      const response = await apiClient.get(NOTICE_ENDPOINTS.GET_NOTICE_BY_ID(noticeId));

      console.log('✅ 공지사항 상세 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 공지사항 상세 조회 실패:', error);
      this._handleApiError(error, '공지사항 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 공지사항 수정용 마크다운 내용 조회
   * @param {number} noticeId - 공지사항 ID
   * @returns {Promise<ApiResponse<NoticeMarkdownResponse>>} API 응답 데이터
   * @description 공지사항 수정 시 기존 마크다운 원본 내용을 조회합니다.
   */
  async getNoticeMarkdown(noticeId) {
    try {
      console.log('📤 공지사항 마크다운 조회 요청:', noticeId);

      const response = await apiClient.get(NOTICE_ENDPOINTS.GET_NOTICE_MARKDOWN(noticeId));

      console.log('✅ 공지사항 마크다운 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 공지사항 마크다운 조회 실패:', error);
      this._handleApiError(error, '공지사항 마크다운 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 공지사항 생성
   * @param {CreateNoticeRequest} noticeData - 생성할 공지사항 데이터 (title, contentMd)
   * @returns {Promise<ApiResponse>} API 응답 데이터
   */
  async createNotice(noticeData) {
    try {
      console.log('📤 공지사항 생성 요청:', noticeData);

      // 데이터 유효성 검사
      this._validateNoticeData(noticeData, true);

      // contentMd로 변환하여 전송 (contentMd 필드로 전송)
      const requestData = {
        title: noticeData.title.trim(),
        contentMd: noticeData.contentMd.trim()
      };

      const response = await apiClient.post(NOTICE_ENDPOINTS.CREATE_NOTICE, requestData);

      console.log('✅ 공지사항 생성 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 공지사항 생성 실패:', error);
      this._handleApiError(error, '공지사항 생성에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 공지사항 수정
   * @param {number} noticeId - 수정할 공지사항 ID
   * @param {UpdateNoticeRequest} noticeData - 수정할 공지사항 데이터 (title, contentMd)
   * @returns {Promise<ApiResponse>} API 응답 데이터
   */
  async updateNotice(noticeId, noticeData) {
    try {
      console.log('📤 공지사항 수정 요청:', { noticeId, noticeData });

      // 데이터 유효성 검사
      this._validateNoticeData(noticeData, false);

      // contentMd로 변환하여 전송 (contentMd 필드로 전송)
      const requestData = {
        title: noticeData.title.trim(),
        contentMd: noticeData.contentMd.trim()
      };

      const response = await apiClient.put(NOTICE_ENDPOINTS.UPDATE_NOTICE(noticeId), requestData);

      console.log('✅ 공지사항 수정 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 공지사항 수정 실패:', error);
      this._handleApiError(error, '공지사항 수정에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 공지사항 삭제
   * @param {number} noticeId - 삭제할 공지사항 ID
   * @returns {Promise<ApiResponse>} API 응답 데이터
   */
  async deleteNotice(noticeId) {
    try {
      console.log('📤 공지사항 삭제 요청:', noticeId);

      const response = await apiClient.delete(NOTICE_ENDPOINTS.DELETE_NOTICE(noticeId));

      console.log('✅ 공지사항 삭제 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 공지사항 삭제 실패:', error);
      this._handleApiError(error, '공지사항 삭제에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 공지사항 이미지 업로드
   * @param {File} file - 업로드할 이미지 파일
   * @returns {Promise<ApiResponse<NoticeImageResponse>>} API 응답 데이터
   */
  async uploadNoticeImage(file) {
    try {
      console.log('📤 공지사항 이미지 업로드 요청:', file.name);

      // 파일 유효성 검사
      if (!file || !(file instanceof File)) {
        throw new Error('유효한 파일을 선택해주세요.');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드할 수 있습니다.');
      }

      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);

      // multipart/form-data로 전송 (Content-Type 헤더는 자동 설정)
      const response = await apiClient.post(NOTICE_ENDPOINTS.UPLOAD_NOTICE_IMAGE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ 공지사항 이미지 업로드 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 공지사항 이미지 업로드 실패:', error);
      this._handleApiError(error, '이미지 업로드에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 공지사항 데이터 유효성 검사
   * @param {CreateNoticeRequest|UpdateNoticeRequest} noticeData - 검사할 공지사항 데이터
   * @param {boolean} isCreate - 생성 여부 (기본값: true)
   * @returns {boolean} 유효성 여부
   * @private
   */
  _validateNoticeData(noticeData, isCreate = true) {
    const { title, contentMd } = noticeData;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('공지사항 제목을 입력해주세요.');
    }

    if (title.length > 100) {
      throw new Error('공지사항 제목은 100자를 초과할 수 없습니다.');
    }

    if (!contentMd || typeof contentMd !== 'string' || contentMd.trim().length === 0) {
      throw new Error('공지사항 내용을 입력해주세요.');
    }

    if (contentMd.length > 5000) {
      throw new Error('공지사항 내용은 5000자를 초과할 수 없습니다.');
    }

    return true;
  }

  /**
   * API 에러 처리
   * @param {Error} error - 에러 객체
   * @param {string} defaultMessage - 기본 에러 메시지
   * @private
   */
  _handleApiError(error, defaultMessage) {
    if (error.response) {
      // 서버에서 응답을 받았지만 에러 상태코드인 경우
      const { status, data } = error.response;
      console.error(`HTTP ${status} 에러:`, data);

      // 서버에서 제공하는 에러 메시지가 있으면 사용
      if (data?.message) {
        throw new Error(data.message);
      }
    } else if (error.request) {
      // 네트워크 에러
      console.error('네트워크 에러:', error.request);
      throw new Error('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
    }

    // 기본 에러 메시지
    throw new Error(defaultMessage);
  }

  /**
   * 날짜 포맷팅
   * @param {string} dateString - ISO 8601 형식의 날짜 문자열
   * @returns {string} 포맷된 날짜 문자열 (YYYY.MM.DD)
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // 잘못된 날짜 형식인 경우 원본 반환
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}.${month}.${day}`;
    } catch (error) {
      console.error('날짜 포맷팅 실패:', error);
      return dateString;
    }
  }

  /**
   * 상대적 시간 표시
   * @param {string} dateString - ISO 8601 형식의 날짜 문자열
   * @returns {string} 상대적 시간 문자열 (예: "2시간 전", "3일 전")
   */
  getRelativeTime(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      if (diffInSeconds < 60) {
        return '방금 전';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}분 전`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}시간 전`;
      } else if (diffInSeconds < 2592000) { // 30일
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}일 전`;
      } else {
        return this.formatDate(dateString);
      }
    } catch (error) {
      console.error('상대적 시간 계산 실패:', error);
      return this.formatDate(dateString);
    }
  }

  /**
   * 텍스트 요약
   * @param {string} text - 요약할 텍스트
   * @param {number} maxLength - 최대 길이 (기본값: 100)
   * @returns {string} 요약된 텍스트
   */
  truncateText(text, maxLength = 100) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * 공지사항 카테고리 분류
   * @param {string} title - 공지사항 제목
   * @returns {string} 카테고리 (기본값: '공지')
   */
  getNoticeCategory(title) {
    if (!title || typeof title !== 'string') {
      return '공지';
    }

    const titleLower = title.toLowerCase();

    // 특정 키워드가 있는 경우에만 다른 카테고리 반환 (하위 호환성)
    if (titleLower.includes('이벤트') || titleLower.includes('event')) {
      return '이벤트';
    } else if (titleLower.includes('업데이트') || titleLower.includes('update')) {
      return '업데이트';
    }

    // 기본값: 공지
    return '공지';
  }
}

// 싱글톤 인스턴스 생성 및 export
export const noticeService = new NoticeService();
export default noticeService;
