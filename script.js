const socket = io("https://omegle-9.onrender.com"); // change to Render backend URL
let peer;
let localStream;

document.getElementById("startBtn").addEventListener("click", async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("myVideo").srcObject = localStream;

  peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };

  peer.ontrack = (event) => {
    document.getElementById("partnerVideo").srcObject = event.streams[0];
  };

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit("offer", offer);
});

socket.on("offer", async (offer) => {
  if (!peer) {
    peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    peer.ontrack = (event) => {
      document.getElementById("partnerVideo").srcObject = event.streams[0];
    };

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById("myVideo").srcObject = localStream;
    localStream.getTracks().forEach(track => peer.addTrack(track, localStream));
  }

  await peer.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  socket.emit("answer", answer);
});

socket.on("answer", async (answer) => {
  if (peer) {
    await peer.setRemoteDescription(new RTCSessionDescription(answer));
  }
});

socket.on("ice-candidate", async (candidate) => {
  if (peer) {
    try {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
    }
  }
});