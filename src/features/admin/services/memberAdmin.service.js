/**
 * Member Admin Service
 * 관리자 회원 관리 API 통신을 담당하는 서비스 레이어
 */
import { apiClient } from 'src/core/api/apiClient.js';

/**
 * 회원 관련 API 엔드포인트
 */
const MEMBER_ENDPOINTS = {
  GET_MEMBERS: '/admin/members',
  GET_MEMBER_DETAIL: (memberId) => `/admin/members/${memberId}`,
};

/**
 * Member Admin Service Class
 */
class MemberAdminService {
  /**
   * 회원 목록 조회
   * @param {Object} params - 쿼리 파라미터
   * @param {number} params.page - 페이지 번호 (기본값: 0)
   * @param {number} params.size - 페이지 크기 (기본값: 20)
   * @param {string} params.sort - 정렬 기준 (기본값: createdAt,DESC)
   * @param {string} params.role - 역할 필터 (USER, ADMIN)
   * @returns {Promise<Object>} 페이징된 회원 목록
   */
  async getMembers(params = {}) {
    try {
      console.log('📤 회원 목록 조회 요청:', params);
      
      const queryParams = {
        page: params.page || 0,
        size: params.size || 20,
        sort: params.sort || 'createdAt,DESC',
        ...(params.role && { role: params.role })
      };
      
      const response = await apiClient.get(MEMBER_ENDPOINTS.GET_MEMBERS, {
        params: queryParams
      });
      
      console.log('✅ 회원 목록 조회 성공:', response.data);
      return this._transformMembersPageData(response.data.data);
    } catch (error) {
      console.error('❌ 회원 목록 조회 실패:', error);
      this._handleApiError(error, '회원 목록 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 회원 상세 조회
   * @param {number} memberId - 회원 ID
   * @returns {Promise<Object>} 회원 상세 정보
   */
  async getMemberDetail(memberId) {
    try {
      console.log('📤 회원 상세 조회 요청:', { memberId });
      
      const response = await apiClient.get(MEMBER_ENDPOINTS.GET_MEMBER_DETAIL(memberId));
      
      console.log('✅ 회원 상세 조회 성공:', response.data);
      return this._transformMemberDetailData(response.data.data);
    } catch (error) {
      console.error('❌ 회원 상세 조회 실패:', error);
      this._handleApiError(error, '회원 상세 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 페이징된 회원 데이터를 프론트엔드 형식으로 변환
   * @param {Object} backendData - 백엔드 페이징 데이터
   * @returns {Object} 변환된 페이징 데이터
   * @private
   */
  _transformMembersPageData(backendData) {
    if (!backendData) {
      console.warn('⚠️ 잘못된 회원 페이징 데이터:', backendData);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        pageNumber: 0,
        pageSize: 20
      };
    }

    return {
      content: this._transformMembersData(backendData.content || []),
      totalElements: backendData.totalElements || 0,
      totalPages: backendData.totalPages || 0,
      pageNumber: backendData.pageable?.pageNumber || 0,
      pageSize: backendData.pageable?.pageSize || 20,
      isFirst: backendData.first ?? true,
      isLast: backendData.last ?? true
    };
  }

  /**
   * 백엔드 회원 목록 데이터를 프론트엔드 형식으로 변환
   * @param {Array} backendMembers - 백엔드 회원 데이터
   * @returns {Array} 변환된 회원 데이터
   * @private
   */
  _transformMembersData(backendMembers) {
    if (!Array.isArray(backendMembers)) {
      console.warn('⚠️ 잘못된 회원 데이터 형식:', backendMembers);
      return [];
    }

    return backendMembers.map(member => ({
      id: member.memberId,
      username: member.username || '',
      nickname: member.nickname || '이름 없음',
      email: member.email || '',
      role: member.role || 'USER',
      point: member.point || 0,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt
    }));
  }

  /**
   * 백엔드 회원 상세 데이터를 프론트엔드 형식으로 변환
   * @param {Object} backendMember - 백엔드 회원 상세 데이터
   * @returns {Object} 변환된 회원 상세 데이터
   * @private
   */
  _transformMemberDetailData(backendMember) {
    if (!backendMember) {
      console.warn('⚠️ 잘못된 회원 상세 데이터:', backendMember);
      return null;
    }

    return {
      // 기본 정보
      id: backendMember.memberId,
      username: backendMember.username || '',
      nickname: backendMember.nickname || '이름 없음',
      email: backendMember.email || '',
      role: backendMember.role || 'USER',
      point: backendMember.point || 0,
      createdAt: backendMember.createdAt,
      updatedAt: backendMember.updatedAt,

      // 로드뷰 통계
      roadviewPracticeGames: backendMember.roadviewPracticeGames || 0,
      roadviewPracticeAvgScore: backendMember.roadviewPracticeAvgScore || 0,
      roadviewRankGames: backendMember.roadviewRankGames || 0,
      roadviewRankAvgScore: backendMember.roadviewRankAvgScore || 0,
      roadviewMultiGames: backendMember.roadviewMultiGames || 0,
      roadviewMultiAvgScore: backendMember.roadviewMultiAvgScore || 0,
      roadviewMultiFirstPlace: backendMember.roadviewMultiFirstPlace || 0,
      roadviewMultiSecondPlace: backendMember.roadviewMultiSecondPlace || 0,
      roadviewMultiThirdPlace: backendMember.roadviewMultiThirdPlace || 0,

      // 포토 통계
      photoPracticeGames: backendMember.photoPracticeGames || 0,
      photoPracticeAvgScore: backendMember.photoPracticeAvgScore || 0,
      photoRankGames: backendMember.photoRankGames || 0,
      photoRankAvgScore: backendMember.photoRankAvgScore || 0,
      photoMultiGames: backendMember.photoMultiGames || 0,
      photoMultiAvgScore: backendMember.photoMultiAvgScore || 0,
      photoMultiFirstPlace: backendMember.photoMultiFirstPlace || 0,
      photoMultiSecondPlace: backendMember.photoMultiSecondPlace || 0,
      photoMultiThirdPlace: backendMember.photoMultiThirdPlace || 0,

      // 공통 통계
      bestScore: backendMember.bestScore || 0,
      currentStreak: backendMember.currentStreak || 0,
      longestStreak: backendMember.longestStreak || 0
    };
  }

  /**
   * API 에러 처리
   * @param {Error} error - API 에러 객체
   * @param {string} defaultMessage - 기본 에러 메시지
   * @private
   */
  _handleApiError(error, defaultMessage) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('📛 잘못된 요청:', data.message || defaultMessage);
          break;
        case 401:
          console.error('📛 인증 실패: 관리자 로그인이 필요합니다.');
          break;
        case 403:
          console.error('📛 권한 없음: 관리자 권한이 필요합니다.');
          break;
        case 404:
          console.error('📛 리소스를 찾을 수 없음:', data.message || '회원을 찾을 수 없습니다.');
          break;
        case 500:
          console.error('📛 서버 내부 오류:', data.message || '서버에서 오류가 발생했습니다.');
          break;
        default:
          console.error('📛 알 수 없는 오류:', data.message || defaultMessage);
      }
    } else if (error.request) {
      console.error('📛 네트워크 오류: 서버에 연결할 수 없습니다.');
    } else {
      console.error('📛 요청 설정 오류:', error.message);
    }
  }
}

// 싱글톤 인스턴스 생성 및 export
export const memberAdminService = new MemberAdminService();
export default memberAdminService;

