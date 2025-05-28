import userService from '@/api/services/user.service';

// 사용자 상태 관리 스토어 모듈
export default {
  namespaced: true,
  
  state: () => ({
    profile: null,
    inventory: [],
    equippedItems: {},
    friends: [],
    isLoading: false,
    error: null
  }),
  
  mutations: {
    // 프로필 설정
    SET_PROFILE(state, profile) {
      state.profile = profile;
    },
    
    // 인벤토리 설정
    SET_INVENTORY(state, items) {
      state.inventory = items;
    },
    
    // 장착 아이템 설정
    SET_EQUIPPED_ITEMS(state, items) {
      state.equippedItems = items;
    },
    
    // 아이템 장착
    EQUIP_ITEM(state, { itemId, category }) {
      state.equippedItems[category] = itemId;
    },
    
    // 친구 목록 설정
    SET_FRIENDS(state, friends) {
      state.friends = friends;
    },
    
    // 친구 추가
    ADD_FRIEND(state, friend) {
      state.friends.push(friend);
    },
    
    // 친구 삭제
    REMOVE_FRIEND(state, friendId) {
      state.friends = state.friends.filter(friend => friend.id !== friendId);
    },
    
    // 로딩 상태 설정
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    
    // 오류 설정
    SET_ERROR(state, error) {
      state.error = error;
    }
  },
  
  actions: {
    // 사용자 프로필 로드
    async loadProfile({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await userService.getProfile();
        commit('SET_PROFILE', response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.message || '프로필을 불러오는데 실패했습니다.');
        return null;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // 인벤토리 로드
    async loadInventory({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await userService.getInventory();
        commit('SET_INVENTORY', response.data.items);
        commit('SET_EQUIPPED_ITEMS', response.data.equipped);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.message || '인벤토리를 불러오는데 실패했습니다.');
        return null;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // 아이템 장착
    async equipItem({ commit }, itemId) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await userService.equipItem(itemId);
        const { category } = response.data;
        commit('EQUIP_ITEM', { itemId, category });
        return true;
      } catch (error) {
        commit('SET_ERROR', error.message || '아이템 장착에 실패했습니다.');
        return false;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // 친구 목록 로드
    async loadFriends({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await userService.getFriends();
        commit('SET_FRIENDS', response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.message || '친구 목록을 불러오는데 실패했습니다.');
        return null;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // 친구 추가
    async addFriend({ commit }, userId) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await userService.addFriend(userId);
        commit('ADD_FRIEND', response.data);
        return true;
      } catch (error) {
        commit('SET_ERROR', error.message || '친구 추가에 실패했습니다.');
        return false;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // 친구 삭제
    async removeFriend({ commit }, userId) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        await userService.removeFriend(userId);
        commit('REMOVE_FRIEND', userId);
        return true;
      } catch (error) {
        commit('SET_ERROR', error.message || '친구 삭제에 실패했습니다.');
        return false;
      } finally {
        commit('SET_LOADING', false);
      }
    }
  },
  
  getters: {
    // 사용자 프로필
    profile: state => state.profile,
    
    // 인벤토리 아이템
    inventoryItems: state => state.inventory,
    
    // 장착된 아이템
    equippedItems: state => state.equippedItems,
    
    // 카테고리별 인벤토리 아이템
    itemsByCategory: state => category => {
      return state.inventory.filter(item => item.category === category);
    },
    
    // 아이템 ID로 아이템 찾기
    itemById: state => id => {
      return state.inventory.find(item => item.id === id) || null;
    },
    
    // 친구 목록
    friends: state => state.friends,
    
    // 온라인 친구 목록
    onlineFriends: state => {
      return state.friends.filter(friend => friend.isOnline);
    }
  }
};
