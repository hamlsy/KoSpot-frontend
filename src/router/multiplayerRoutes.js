import MultiplayerLobby from '@/features/game/multiplayer/lobby/views/MultiplayerLobby.vue';
import IndividualRoadViewGame from '@/views/Game/MultiplayerMode/components/gameplay/roadview/IndividualRoadViewGame.vue';
import TeamRoadViewGame from '@/views/Game/MultiplayerMode/components/gameplay/roadview/TeamRoadViewGame.vue';
import TestVoting from '@/views/Game/MultiplayerMode/components/gameplay/TestVoting.vue';

const multiplayerRoutes = [
    {
        path: '/multiplayerLobby',
        name: "MultiplayerLobby",
        component: MultiplayerLobby
    },
    {
        path: '/gameRoom/:roomId',
        name: "GameRoomWaiting",
        component: () => import('@/views/Game/MultiplayerMode/components/room/waiting/MultiplayerRoomWaiting.vue'),
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
        component: () => import('@/features/game/multiplayer/photo/views/MultiplayerPhotoGame.vue'),
        props: true
    },
    {
        path: '/testPhotoIndividual',
        name: "TestPhotoIndividual",
        component: () => import('@/features/game/multiplayer/photo/views/MultiplayerPhotoGame.vue'),
        props: { roomId: 'test-individual', isTeamMode: false }
    },
    {
        path: '/testPhotoTeam',
        name: "TestPhotoTeam",
        component: () => import('@/features/game/multiplayer/photo/views/MultiplayerPhotoGame.vue'),
        props: { roomId: 'test-team', isTeamMode: true }
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
    {
        path: '/testPhotoIndividual',
        name: "TestPhotoIndividual",
        component: () => import('@/features/game/multiplayer/photo/views/MultiplayerPhotoGame.vue'),
        props: { roomId: 'photo-individual-test', isTeamMode: false }
    },
    {
        path: '/testPhotoTeam',
        name: "TestPhotoTeam",
        component: () => import('@/features/game/multiplayer/photo/views/MultiplayerPhotoGame.vue'),
        props: { roomId: 'photo-team-test', isTeamMode: true }
    },
    {
        path: '/testVoting',
        name: "TestVoting",
        component: TestVoting
    },
];

export default multiplayerRoutes;
