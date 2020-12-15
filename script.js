const videoElem = document.getElementById("video");
const startElem = document.getElementById("start");
const stopElem = document.getElementById("stop");

// Options for getDisplayMedia()

var displayMediaOptions = {
  video: {
    cursor: "always"
  },
  audio: false
};

// Set event listeners for the start and stop buttons
startElem.addEventListener("click", function(evt) {
  startCapture();
}, false);

stopElem.addEventListener("click", function(evt) {
  stopCapture();
}, false);
const gdmOptions = {
  video: {
    cursor: "always"
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100
  }
}
async function startCapture(displayMediaOptions) {
  let captureStream = null;

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
  } catch(err) {
    console.error("Error: " + err);
  }
  return captureStream;
}
// Generate random room name if needed
if (!location.hash) {
    location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
   }
   const roomHash = location.hash.substring(1);
   const configuration = {
    iceServers: [{
      urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
    }]
   };
   function onSuccess() {

   };
   
   function onError(error) {
         console.error(error);
        };
        // Room name needs to be prefixed with 'observable-'
const roomName = 'observable-' + roomHash;
let room;
const drone = new ScaleDrone('nwXO6vRIQUcSiygz');
 
drone.on('open', error => {
 if (error) {
   return onError(error);
 }
 room = drone.subscribe(roomName);
 room.on('open', error => {
   if (error) {
     onError(error);
   }
 });
 // We're connected to the room and received an array of 'members'
 // connected to the room (including us). Signaling server is ready.
 room.on('members', members => {
   if (members.length >= 3) {
     return alert('The room is full');
   }
   // If we are the second user to connect to the room we will be creating the offer
   const isOfferer = members.length === 2;
   startWebRTC(isOfferer);
   startListentingToSignals();
 });
});
// Send signaling data via Scaledrone
function sendMessage(message) {
    drone.publish({
      room: roomName,
      message
        
    });
   }
   let pc;

// share screen (let's hope this works...)
function screenShare(){
  startCapture(gdmOptions)
    var screenShareHandler = document.getElementById("screen-share")
    sendMessage(screenShareHandler);
}
function startWebRTC(isOfferer) {
 pc = new RTCPeerConnection(configuration);
 
 // 'onicecandidate' notifies us whenever an ICE agent needs to deliver a
 // message to the other peer through the signaling server
 pc.onicecandidate = event => {
   if (event.candidate) {
     sendMessage({'candidate': event.candidate});
   }
 };
 
 // If user is offerer let the 'negotiationneeded' event create the offer
 if (isOfferer) {
   pc.onnegotiationneeded = () => {
     pc.createOffer().then(localDescCreated).catch(onError);
   }
 }
 
 // When a remote stream arrives display it in the #remoteVideo element
 pc.onaddstream = event => {
   remoteVideo.srcObject = event.stream;
 };
 
 navigator.mediaDevices.getUserMedia({
   audio: true,
   video: true,
 }).then(stream => {
   // Display your local video in #localVideo element
   localVideo.srcObject = stream;
   // Add your stream to be sent to the conneting peer
   pc.addStream(stream);
 }, onError);
}
function startListentingToSignals() {
    // Listen to signaling data from Scaledrone
    room.on('data', (message, client) => {
      // Message was sent by us
      if (!client || client.id === drone.clientId) {
        return;
      }
      if (message.sdp) {
        // This is called after receiving an offer or answer from another peer
        pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
          // When receiving an offer lets answer it
          if (pc.remoteDescription.type === 'offer') {
            pc.createAnswer().then(localDescCreated).catch(onError);
          }
        }, onError);
      } else if (message.candidate) {
        // Add the new ICE candidate to our connections remote description
        pc.addIceCandidate(
          new RTCIceCandidate(message.candidate), onSuccess, onError
        );
      }
    });
   }
   
   //localDescCreated gets called when creating an offer and when answering one. It updates the local description of the connection.
   
   function localDescCreated(desc) {
    pc.setLocalDescription(
      desc,
      () => sendMessage({'sdp': pc.localDescription}),
      onError
    );
   }
   
