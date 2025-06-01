# KoSpot Multiplayer Mode Cleanup Plan

## Duplicate Components to Remove

1. **Chat Components**:
   - Remove `components/gameplay/IndividualChat.vue` (keep `components/gameplay/chat/IndividualChat.vue`)
   - Remove `components/lobby/MultiplayerLobbyChatWindow.vue` (keep `components/lobby/chat/MultiplayerLobbyChatWindow.vue`)
   - Update all imports to reference the correct paths

2. **Results Components**:
   - Remove `components/results/` folder entirely (keep `components/gameplay/results/`)
   - Update all imports to reference the correct paths

3. **Other Duplicates**:
   - Check for and remove any other duplicate components

## Import Updates Required

After removing duplicates, we need to update imports in the following files:
- MultiplayerGame.vue
- MultiplayerLobby.vue
- IndividualRoadViewGame.vue
- TeamRoadViewGame.vue
- MultiplayerPhotoGame.vue
- MultiplayerRoomChat.vue

## MultiplayerRoomWaiting Redesign

The redesign will follow these design principles:
- Soft, refreshing gradient colors
- Well-proportioned white space
- Light and immersive user experience
- Clear information hierarchy with subtle shadows and modular card layouts
- Refined rounded corners
- Delicate micro-interactions
- Comfortable visual proportions
- Accent colors based on game mode
- All text in black or white only
