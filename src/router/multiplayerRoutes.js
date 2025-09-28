import LobbyView from 'src/features/game/multiplayer/lobby/views/LobbyView.vue'

//roadview
import SoloRoadViewGameView from '@/features/game/multiplayer/roadview/views/SoloGameView.vue'
import TeamRoadViewGameView from 'src/features/game/multiplayer/roadview/views/TeamGameView.vue'

//photo
import PhotoGameView from 'src/features/game/multiplayer/photo/views/GameView.vue'

//room
import RoomView from 'src/features/game/multiplayer/room/views/RoomView.vue'

const multiplayerRoutes = [
    {
        path: '/lobby',
        name: "MultiplayerLobby",
        component: LobbyView
    },
    {
        path: '/gameRoom/:roomId',
        name: "RoomView",
        component: RoomView,
        props: true
    },
    {
        path: '/game/roadview/:roomId/solo',
        name: "SoloRoadViewGameView",
        component: SoloRoadViewGameView,
        props: true
    },
    {
        path: '/game/photo/:roomId',
        name: "PhotoGameView",
        component: PhotoGameView,
        props: true
    },
    {
        path: '/testPhotoSolo',
        name: "TestPhotoSolo",
        component: PhotoGameView,
        props: { roomId: 'test-solo', isTeamMode: false }
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
        path: '/testSoloGame',
        name: "TestSoloGame",
        component: SoloRoadViewGameView,
        props: { roomId: 'solo-test-123', isTeamMode: false }
    },
    {
        path: '/testPhotoSolo',
        name: "TestPhotoSolo",
        component: PhotoGameView,
        props: { roomId: 'photo-solo-test', isTeamMode: false }
    },
    {
        path: '/testPhotoTeam',
        name: "TestPhotoTeam",
        component: PhotoGameView,
        props: { roomId: 'photo-team-test', isTeamMode: true }
    },
  
];

export default multiplayerRoutes;
