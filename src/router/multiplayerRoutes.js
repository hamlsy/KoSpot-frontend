import MultiplayerLobby from '@/components/game/multiplayerMode/lobby/MultiplayerLobbyMain.vue';
import MultiplayerRoadViewGame from '@/components/game/multiplayerMode/gameplay/roadview/MultiplayerRoadViewGame.vue';

const multiplayerRoutes = [
    {
        path: '/multiplayerLobby',
        name: "MultiplayerLobby",
        component: MultiplayerLobby
    },
    {
        path: '/gameRoom/:roomId',
        name: "GameRoomWaiting",
        component: () => import('@/components/game/multiplayerMode/room/waiting/MultiplayerRoomWaiting.vue'),
        props: true
    },
    {
        path: '/game/roadview/:roomId',
        name: "RoadViewGame",
        component: MultiplayerRoadViewGame,
        props: true
    },
    {
        path: '/game/photo/:roomId',
        name: "PhotoGame",
        component: () => import('@/components/game/multiplayerMode/gameplay/photo/MultiplayerPhotoGame.vue'),
        props: true
    },
    {
        path: '/testTeamGame',
        name: "TestTeamGame",
        component: () => import('@/components/game/multiplayerMode/gameplay/roadview/MultiplayerRoadViewGame.vue'),
        props: { roomId: 'team-test-123', isTeamMode: true }
    },
    {
        path: '/testIndividualGame',
        name: "TestIndividualGame",
        component: () => import('@/components/game/multiplayerMode/gameplay/roadview/MultiplayerRoadViewGame.vue'),
        props: { roomId: 'individual-test-123', isTeamMode: false }
    },
    {
        path: '/team-mode',
        name: 'TeamModeGame',
        component: () => import('@/components/game/multiplayerMode/gameplay/roadview/MultiplayerRoadViewGame.vue'),
        props: { isTeamMode: true }
    }
];

export default multiplayerRoutes;
