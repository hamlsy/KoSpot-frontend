import authService from '../../store/modules/auth';
import gameService from '../../store/modules/game';
import multiplayerService from './multiplayer.service';
import userService from '../../store/modules/user';

/**
 * API 서비스 모듈
 */
export {
  authService,
  gameService,
  multiplayerService,
  userService
};

/**
 * 기본 내보내기
 */
export default {
  auth: authService,
  game: gameService,
  user: userService,
  multiplayer: multiplayerService
};
