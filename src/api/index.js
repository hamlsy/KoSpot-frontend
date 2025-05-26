import apiClient from './apiClient';
import * as services from './services';

/**
 * API 모듈
 */
export { apiClient };
export { services };

/**
 * 기본 내보내기
 */
export default {
  client: apiClient,
  ...services.default
};
