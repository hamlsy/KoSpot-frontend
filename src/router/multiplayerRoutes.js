import MultiplayerLobby from '@/components/game/multiplayerMode/lobby/MultiplayerLobbyMain.vue';
import IndividualRoadViewGame from '@/components/game/multiplayerMode/gameplay/roadview/IndividualRoadViewGame.vue';
import TeamRoadViewGame from '@/components/game/multiplayerMode/gameplay/roadview/TeamRoadViewGame.vue';

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
        path: '/game/roadview/:roomId/individual',
        name: "RoadViewGame",
        component: IndividualRoadViewGame,
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
        component: TeamRoadViewGame,
        props: { roomId: 'team-test-123', isTeamMode: true }
    },
    {
        path: '/testIndividualGame',
        name: "TestIndividualGame",
        component: IndividualRoadViewGame,
        props: { roomId: 'individual-test-123', isTeamMode: false }
    },
    
];

export default multiplayerRoutes;
