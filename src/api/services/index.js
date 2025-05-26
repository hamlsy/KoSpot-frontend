import authService from './auth.service';
import gameService from './game.service';
import multiplayerService from './multiplayer.service';
import userService from './user.service';

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
