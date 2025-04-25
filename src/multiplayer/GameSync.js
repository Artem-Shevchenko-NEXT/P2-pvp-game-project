//Handles game synchronization

/* Hey, im writing in english so that i will have a log i could use for when the report is gonna be written 
---Also i just want to clarify what my ida with this class  was as i kind of built the networkmanager twoards that
---but feel free to do it in whateverway you want  + feel free to delet this comment section

as i said, when we talked yesterday ths code/class should handle the synchronization of game state 
between the local player and remote players. so basically it shoudl function as a bridge between 
the NetworkManager and the Game scene.

The main responsibilities of this class should somthing along these lines :
managing remote player instances(by witch i mean rendering players from different windows) in the game
handling network events related to playr joinning/leaving
updating remote player positions and animations based on received data
providing methods to easily synchronize local player state

as i said for thsi it would be best to work with the existing NetworkManager which already handles 
the socket connection and provides events through the .on() method. 
The NetworkManager can listen for:
'gameJoined'  When the player successfully joins a game room
'playerUpdated' - When another player sends position updates
 
you will need to tinker with the Game scene(Game.js),to add code for the remote player creation
and keep their visual represantation in sync with the data received from the server.

you will also nedd to tinker with server.js, check  the 'TODO:' comment

Lastly the Game scene (Game.js) already handles sendinng player updates to the server throug NetworkManager,
but if you want you can move that logic into this clas for consistency.

(extra info: the browser console will only show the updates that the local player is sending, 
but the serve itself recives all updates from all players together at the same time)
 */