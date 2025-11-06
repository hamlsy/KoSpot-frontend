/**
 * Coordinate Admin Service
 * 관리자 좌표 관리 API 통신을 담당하는 서비스 레이어
 */
import { apiClient } from 'src/core/api/apiClient.js';

/**
 * 좌표 관련 API 엔드포인트
 */
const COORDINATE_ENDPOINTS = {
  GET_COORDINATES: '/admin/coordinates',
  CREATE_COORDINATE: '/admin/coordinates',
  IMPORT_EXCEL: '/admin/coordinates/import-excel',
  DELETE_COORDINATE: (coordinateId) => `/admin/coordinates/${coordinateId}`,
};

/**
 * Coordinate Admin Service Class
 */
class CoordinateAdminService {
  /**
   * 좌표 목록 조회
   * @param {Object} params - 쿼리 파라미터
   * @param {number} params.page - 페이지 번호 (기본값: 0)
   * @param {number} params.size - 페이지 크기 (기본값: 20)
   * @param {string} params.sort - 정렬 기준 (기본값: createdAt,DESC)
   * @returns {Promise<Object>} 페이징된 좌표 목록
   */
  async getCoordinates(params = {}) {
    try {
      console.log('📤 좌표 목록 조회 요청:', params);
      
      const queryParams = {
        page: params.page || 0,
        size: params.size || 20,
        sort: params.sort || 'createdAt,DESC'
      };
      
      const response = await apiClient.get(COORDINATE_ENDPOINTS.GET_COORDINATES, {
        params: queryParams
      });
      
      console.log('✅ 좌표 목록 조회 성공:', response.data);
      return this._transformCoordinatesPageData(response.data.data);
    } catch (error) {
      console.error('❌ 좌표 목록 조회 실패:', error);
      this._handleApiError(error, '좌표 목록 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 좌표 생성
   * @param {Object} coordinateData - 좌표 데이터
   * @param {number} coordinateData.lat - 위도
   * @param {number} coordinateData.lng - 경도
   * @param {string} coordinateData.poiName - POI 이름
   * @param {string} coordinateData.sidoKey - 시도 코드
   * @param {string} coordinateData.sigungu - 시군구
   * @param {string} coordinateData.detailAddress - 상세 주소
   * @param {string} coordinateData.locationType - 위치 타입
   * @returns {Promise<number>} 생성된 좌표 ID
   */
  async createCoordinate(coordinateData) {
    try {
      console.log('📤 좌표 생성 요청:', coordinateData);
      
      const response = await apiClient.post(COORDINATE_ENDPOINTS.CREATE_COORDINATE, coordinateData);
      
      console.log('✅ 좌표 생성 성공:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ 좌표 생성 실패:', error);
      this._handleApiError(error, '좌표 생성에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 좌표 엑셀 업로드
   * @param {File} file - 엑셀 파일
   * @returns {Promise<Object>} API 응답
   */
  async importExcel(file) {
    try {
      console.log('📤 좌표 엑셀 업로드 요청:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      
      // 백엔드: @PostMapping(value = "/import-excel", consumes = "multipart/form-data")
      // @RequestParam("file") MultipartFile file
      // 필드명: file (MultipartFile)
      // FormData를 사용할 때는 Content-Type을 명시하지 않아야 Axios가 자동으로 boundary를 포함한 Content-Type을 설정합니다
      const response = await apiClient.post(COORDINATE_ENDPOINTS.IMPORT_EXCEL, formData, {
        headers: {
          'Content-Type': undefined  // FormData 사용 시 기본 Content-Type 제거
        }
      });
      
      console.log('✅ 좌표 엑셀 업로드 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 좌표 엑셀 업로드 실패:', error);
      this._handleApiError(error, '좌표 엑셀 업로드에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 좌표 삭제
   * @param {number} coordinateId - 좌표 ID
   * @returns {Promise<Object>} API 응답
   */
  async deleteCoordinate(coordinateId) {
    try {
      console.log('📤 좌표 삭제 요청:', { coordinateId });
      
      const response = await apiClient.delete(COORDINATE_ENDPOINTS.DELETE_COORDINATE(coordinateId));
      
      console.log('✅ 좌표 삭제 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 좌표 삭제 실패:', error);
      this._handleApiError(error, '좌표 삭제에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 페이징된 좌표 데이터를 프론트엔드 형식으로 변환
   * @param {Object} backendData - 백엔드 페이징 데이터
   * @returns {Object} 변환된 페이징 데이터
   * @private
   */
  _transformCoordinatesPageData(backendData) {
    if (!backendData) {
      console.warn('⚠️ 잘못된 좌표 페이징 데이터:', backendData);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        pageNumber: 0,
        pageSize: 20
      };
    }

    return {
      content: this._transformCoordinatesData(backendData.content || []),
      totalElements: backendData.totalElements || 0,
      totalPages: backendData.totalPages || 0,
      pageNumber: backendData.pageable?.pageNumber || 0,
      pageSize: backendData.pageable?.pageSize || 20,
      isFirst: backendData.first ?? true,
      isLast: backendData.last ?? true
    };
  }

  /**
   * 백엔드 좌표 데이터를 프론트엔드 형식으로 변환
   * @param {Array} backendCoordinates - 백엔드 좌표 데이터
   * @returns {Array} 변환된 좌표 데이터
   * @private
   */
  _transformCoordinatesData(backendCoordinates) {
    if (!Array.isArray(backendCoordinates)) {
      console.warn('⚠️ 잘못된 좌표 데이터 형식:', backendCoordinates);
      return [];
    }

    return backendCoordinates.map(coord => ({
      id: coord.coordinateId,
      lat: coord.lat,
      lng: coord.lng,
      poiName: coord.poiName || '이름 없음',
      sido: coord.sido || '',
      sigungu: coord.sigungu || '',
      detailAddress: coord.detailAddress || '',
      locationType: coord.locationType || 'LANDMARK'
    }));
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
          console.error('📛 리소스를 찾을 수 없음:', data.message || '좌표를 찾을 수 없습니다.');
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
export const coordinateAdminService = new CoordinateAdminService();
export default coordinateAdminService;

