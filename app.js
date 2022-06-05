let socket = null;

/* HANDLING THEME CHANGE */

const root = document.querySelector(":root");
const themeButton = document.querySelector("#theme");
const moon = document.querySelector("#moon-svg");
const sun = document.querySelector("#sun-svg");

let currentTheme = "moon";
moon.style.display = "none";

themeButton.onclick = () => {
  // const bgColor = getComputedStyle(root).getPropertyValue("--bg");
  if (currentTheme === "moon") {
    root.style.setProperty(
      "--background",
      "linear-gradient(to right, #ffecc8 0%, #dab166 100%)"
    );
    root.style.setProperty("--back", "#f5deb3");
    root.style.setProperty("--front", "#130F40");
    root.style.setProperty("--screen", "#130f40bf");
    [currentTheme, moon.style.display, sun.style.display] = [
      "sun",
      "inline-block",
      "none",
    ];
  } else if (currentTheme === "sun") {
    root.style.setProperty(
      "--background",
      "linear-gradient(to right, #130F40 0%, #000000 100%)"
    );
    root.style.setProperty("--back", "#130F40");
    root.style.setProperty("--front", "#f5deb3");
    root.style.setProperty("--screen", "#f5deb3bf");
    [currentTheme, moon.style.display, sun.style.display] = [
      "moon",
      "none",
      "inline-block",
    ];
  }
};

/* HANDLING DROPDOWN */

const closeDropdown = () => {
  const dropdowns = document.getElementsByClassName("dropdown-content");
  for (let i = 0; i < dropdowns.length; i++) {
    if (dropdowns[i].classList.contains("show"))
      dropdowns[i].classList.remove("show");
  }
};

document.querySelector("#dropbtn-1").onclick = () => {
  closeDropdown();
  document.querySelector("#dropdown-1").classList.toggle("show");
};

// Close the dropdown if the user clicks outside of it
window.onclick = (event) => {
  if (!event.target.matches(".dropbtn")) closeDropdown();
};

/* HANDLING UPPER TABS */

let tabsBody = [];
const welcomeBody = document.querySelector("#welcome");
tabsBody.push(welcomeBody);
const messageBody = document.querySelector("#message");
tabsBody.push(messageBody);
const videoBody = document.querySelector("#video-call");
tabsBody.push(videoBody);
const ssBody = document.querySelector("#screen-share");
tabsBody.push(ssBody);

const closeTabs = () => {
  tabsBody.forEach((each) => {
    each.style.display = "none";
  });
};

let [lastView, peerLastView] = ["camera", "camera"];
document.querySelector("#tab1").onclick = () => {
  closeTabs();
  messageBody.style.display = "flex";
};
document.querySelector("#tab2").onclick = () => {
  closeTabs();
  lastView = "camera";
  if (socket) socket.emit("view-video", lastView);
  videoBody.style.display = "flex";
};
document.querySelector("#tab3").onclick = () => {
  closeTabs();
  lastView = "screen";
  if (socket) socket.emit("view-video", lastView);
  ssBody.style.display = "block";
};

/* HANDLING MESSAGE, VIDEO */

const serverAddress = "http://127.0.0.1:5000";

const inmessage = document.querySelector("#inmessage");
const outmessage = document.querySelector("#outmessage");
const messageBox = document.querySelector("#message-box");
const sendButton = document.querySelector("#send");

const inBox = document.querySelector("#incoming");
const outBox = document.querySelector("#outgoing");

const connectButton = document.querySelector("#connect");
const callButton = document.querySelector("#receive-button");
const hangupButton = document.querySelector("#hangup-button");

const toggleVid = document.querySelector("#toggle-vid");
const toggleMic = document.querySelector("#toggle-mic");
const toggleShare = document.querySelector("#toggle-share");

let [serverConnected, peerConnected, personRole] = [null, false, "sender"];
callButton.disabled = true;
hangupButton.disabled = true;
toggleVid.disabled = true;
toggleMic.disabled = true;
toggleShare.disabled = true;

const configuration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    // {
    //   urls: "stun:stun1.l.google.com:19302",
    // },
    // {
    //   urls: "stun:stun2.l.google.com:19302",
    // },
    // {
    //   urls: "stun:stun3.l.google.com:19302",
    // },
    // {
    //   urls: "stun:stun4.l.google.com:19302",
    // },
    // {
    //   urls: "stun:stun.stunprotocol.org",
    // },
    // {
    //   urls: "turn:openrelay.metered.ca:80",
    //   username: "openrelayproject",
    //   credential: "openrelayproject",
    // },
    // {
    //   urls: "turn:openrelay.metered.ca:443",
    //   username: "openrelayproject",
    //   credential: "openrelayproject",
    // },
    // {
    //   url: "turn:turn.bistri.com:80",
    //   username: "homeo",
    //   credential: "homeo",
    // },
    // {
    //   url: "turn:numb.viagenie.ca",
    //   username: "webrtc@live.com",
    //   credential: "muazkh",
    // },
    // {
    //   url: "turn:turn.anyfirewall.com:443?transport=tcp",
    //   credential: "webrtc",
    //   username: "webrtc",
    // },
  ],
};
const localConnection = new RTCPeerConnection(configuration);
let dataChannel = null;

// adding event listeners for icecandidate
const iceCandidates = [];
let counter = 0;
localConnection.addEventListener("icecandidate", (event) => {
  if (event.candidate) {
    iceCandidates.push(event.candidate);
    console.log("icecandidate -", ++counter);
  } else {
    socket.emit(
      "emit-SDP",
      JSON.stringify({
        description: localConnection.localDescription,
        icecandidates: iceCandidates,
      })
    );
    console.log("ice-search completed");
  }
});

// creating the local mediachannel
const senders = []; // get the senderObjects when pushing media channel
const mediaStream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true,
});
mediaStream.getTracks().forEach((track) => {
  senders.push(localConnection.addTrack(track, mediaStream));
});
const setMediaState = (mediaType, bool) => {
  if (mediaType === "audio") {
    mediaStream.getAudioTracks()[0].enabled = bool;
  } else if (mediaType === "video") {
    mediaStream.getVideoTracks()[0].enabled = bool;
  }
  outBox.srcObject = mediaStream;
};

setMediaState("audio", false);
setMediaState("video", false);

const vidSvg = document.querySelector("#vid-svg");
const noVidSvg = document.querySelector("#no-vid-svg");

let vidState = false;
noVidSvg.style.display = "none";

toggleVid.onclick = () => {
  vidState = !vidState;
  setMediaState("video", vidState);

  if (vidState)
    [vidSvg.style.display, noVidSvg.style.display] = ["none", "inline-block"];
  else
    [vidSvg.style.display, noVidSvg.style.display] = ["inline-block", "none"];
};

const micSvg = document.querySelector("#mic-svg");
const noMicSvg = document.querySelector("#no-mic-svg");

let micState = false;
noMicSvg.style.display = "none";

toggleMic.onclick = () => {
  micState = !micState;
  setMediaState("audio", micState);

  if (micState)
    [micSvg.style.display, noMicSvg.style.display] = ["none", "inline-block"];
  else
    [micSvg.style.display, noMicSvg.style.display] = ["inline-block", "none"];
};

// screen sharing
const shareScreen = document.querySelector(".share-screen");

const shareSvg = document.querySelector("#share-svg");
const noShareSvg = document.querySelector("#no-share-svg");

let [displayMediaStream, shareState] = [null, false];
noShareSvg.style.display = "none";

toggleShare.onclick = async () => {
  if (!displayMediaStream) {
    displayMediaStream = await navigator.mediaDevices.getDisplayMedia({
      cursor: true,
    });
    displayMediaStream.getVideoTracks()[0].onended = () => {
      socket.emit("share-state", false);
      displayMediaStream = null;
      shareState = false;

      getCameraTrack();
      [shareSvg.style.display, noShareSvg.style.display] = [
        "inline-block",
        "none",
      ];
    };
  }
  shareState = !shareState;
  socket.emit("share-state", shareState);

  if (shareState) {
    getScreenTrack();
    [shareSvg.style.display, noShareSvg.style.display] = [
      "none",
      "inline-block",
    ];
  } else {
    getCameraTrack();
    [shareSvg.style.display, noShareSvg.style.display] = [
      "inline-block",
      "none",
    ];
  }
};

function getScreenTrack() {
  if (displayMediaStream && peerLastView === "screen")
    senders
      .find((sender) => sender.track.kind === "video")
      .replaceTrack(displayMediaStream.getTracks()[0]);
}

function getCameraTrack() {
  senders
    .find((sender) => sender.track.kind === "video")
    .replaceTrack(mediaStream.getVideoTracks()[0]);
}

// capturing the remote videochannel
localConnection.addEventListener("track", async (event) => {
  const [remoteStream] = event.streams;
  inBox.srcObject = remoteStream;
  shareScreen.srcObject = remoteStream;
  console.log("Media channel opened");
});

connectButton.onclick = (event) => {
  try {
    socket = io(serverAddress); // server ip
    serverConnected = true;
    socket.on("connect", () => {
      console.log(socket.id);
    });
  } catch (e) {
    serverConnected = false;
    alert("Server not found");
  }

  if (serverConnected) {
    connectButton.textContent = "Connected";
    connectButton.disabled = true;
    callButton.disabled = false;

    socket.on("line-busy", (obj) => {
      callButton.disabled = true;
    });

    socket.on("view-video", (videoType) => {
      peerLastView = videoType;
      if (videoType === "camera") getCameraTrack();
      else if (videoType === "screen") getScreenTrack();
    });

    socket.on("share-state", (state) => {
      if (state) shareScreen.style.visibility = "visible";
      else shareScreen.style.visibility = "hidden";
    });

    socket.on("get-SDP", (obj) => {
      const { description, icecandidates } = JSON.parse(obj);
      toggleVid.disabled = false;
      toggleMic.disabled = false;
      toggleShare.disabled = false;

      if (description.type === "offer") personRole = "receiver";

      if (personRole === "sender") {
        // accepting the answer
        localConnection.setRemoteDescription(description).then(() => {
          console.log("Answer accepted");
        });

        // adding proposed icecandidates
        icecandidates.forEach((candidate) => {
          localConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });

        peerConnected = true;
      } else if (personRole === "receiver") {
        callButton.disabled = false;

        // accepting the offer
        localConnection.setRemoteDescription(description).then(() => {
          console.log("Offer accepted");
        });

        // adding proposed icecandidates
        icecandidates.forEach((candidate) => {
          localConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });

        callButton.classList.add("vibrate");
      }
    });
  }
};

callButton.onclick = (event) => {
  if (personRole === "sender") {
    socket.emit("line-busy", null);

    // creating a new datachannel
    dataChannel = localConnection.createDataChannel("channel");
    dataChannel.onopen = (event) => {
      socket.emit("share-state", shareState);
      console.log("Channel opened");
    };
    dataChannel.onclose = (event) => {
      console.log("Channel closed");
    };
    dataChannel.onmessage = (event) => {
      inmessage.innerHTML += event.data + "\n";
    };

    // creating the offer
    localConnection
      .createOffer()
      .then((offer) => {
        localConnection.setLocalDescription(offer);
      })
      .then(() => {
        console.log("Offer initiated");
      });
  } else if (personRole === "receiver") {
    callButton.classList.remove("vibrate");

    // capturing the datachannel
    localConnection.ondatachannel = (Event) => {
      dataChannel = Event.channel;
      dataChannel.onopen = (event) => {
        socket.emit("share-state", shareState);
        peerConnected = true;
        console.log("Channel opened");
      };
      dataChannel.onclose = (event) => {
        console.log("Channel closed");
      };
      dataChannel.onmessage = (event) => {
        inmessage.innerHTML += event.data + "\n";
      };
    };

    // creating the answer
    localConnection
      .createAnswer()
      .then((answer) => localConnection.setLocalDescription(answer))
      .then(() => {
        console.log("Answer initiated");
      });
  }

  callButton.disabled = true;
  hangupButton.disabled = false;
};

sendButton.onclick = (event) => {
  if (messageBox.value != null && messageBox.value != "" && peerConnected) {
    dataChannel.send(messageBox.value);
    outmessage.innerHTML += messageBox.value + "\n";
    messageBox.value = "";
  }
};

hangupButton.onclick = (event) => {
  localConnection.close();
  setTimeout(() => {
    location.reload();
  }, 500);
};
