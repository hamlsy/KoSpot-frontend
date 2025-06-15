import MultiplayerLobby from '@/features/game/multiplayer/lobby/views/MultiplayerLobby.vue';

//roadview
import IndividualRoadViewGameView from 'src/features/game/multiplayer/roadview/views/IndividualGameView.vue'
import TeamRoadViewGameView from 'src/features/game/multiplayer/roadview/views/TeamGameView.vue'

//photo
import PhotoGameView from 'src/features/game/multiplayer/photo/views/GameView.vue'

//room
import RoomView from 'src/features/game/multiplayer/room/views/RoomView.vue'

const multiplayerRoutes = [
    {
        path: '/multiplayerLobby',
        name: "MultiplayerLobby",
        component: MultiplayerLobby
    },
    {
        path: '/gameRoom/:roomId',
        name: "RoomView",
        component: RoomView,
        props: true
    },
    {
        path: '/game/roadview/:roomId/individual',
        name: "IndividualRoadViewGameView",
        component: IndividualRoadViewGameView,
        props: true
    },
    {
        path: '/game/photo/:roomId',
        name: "PhotoGameView",
        component: PhotoGameView,
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
        component: PhotoGameView,
        props: { roomId: 'test-team', isTeamMode: true }
    },
    {
        path: '/testTeamGame',
        name: "TestTeamGame",
        component: TeamRoadViewGameView,
        props: { roomId: 'team-test-123', isTeamMode: true }
    },
    {
        path: '/testIndividualGame',
        name: "TestIndividualGame",
        component: IndividualRoadViewGameView,
        props: { roomId: 'individual-test-123', isTeamMode: false }
    },
    {
        path: '/testPhotoIndividual',
        name: "TestPhotoIndividual",
        component: PhotoGameView,
        props: { roomId: 'photo-individual-test', isTeamMode: false }
    },
    {
        path: '/testPhotoTeam',
        name: "TestPhotoTeam",
        component: () => import('@/features/game/multiplayer/photo/views/MultiplayerPhotoGame.vue'),
        props: { roomId: 'photo-team-test', isTeamMode: true }
    },
  
];

export default multiplayerRoutes;
