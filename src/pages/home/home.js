import React, { useRef, useState } from "react";

const Home = () => { 
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [isVideoOn, setIsVideoOn] = useState(false);

    const devicesList = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const devicesInfo = devices.map(device => ({
          label: device.label,
          id: device.deviceId,
          kind: device.kind,
          toJSON: device.toJSON(),
        }));
        console.log(JSON.stringify(devicesInfo, 100, 2));
      } catch (err) {
        console.error(`${err.name}: ${err.message}`);
      }
    };

    const constraints = async () => {
      const constraints = await navigator.mediaDevices.getSupportedConstraints();;
      console.log(constraints)
    }
    

    

    // Function to start streaming local video
    const toggleVideo = async () => {
        if (isVideoOn) {
            // Stop the stream
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        } else {
            // Start the stream
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
            }
        }
        // Toggle the state of isVideoOn
        setIsVideoOn(!isVideoOn);
    };

   // Function to establish a peer-to-peer connection
   const startConnection = async () => {
    try {
      const configuration = {
        iceServers: [
          { urls: "stun:stun.stunprotocol.org" }, // Use a STUN server for NAT traversal
        ],
      };

      const pc = new RTCPeerConnection(configuration);

      // Add local stream to peer connection
      if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      }

      // Set up event handlers for ICE candidates and remote stream
      pc.onicecandidate = handleIceCandidate;
      pc.ontrack = handleTrack;

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to the other peer (through signaling server)
      // For testing purposes, you can log the offer and copy it manually
      console.log("Offer:", offer);

      // Save the peer connection instance
      setPeerConnection(pc);
    } catch (error) {
      console.error('Error establishing connection:', error);
    }
  };

  const handleIceCandidate = (event) => {
    if (event.candidate) {
      // Send the ICE candidate to the other peer (through signaling server)
      console.log("ICE candidate:", event.candidate);
    }
  };

  // Function to handle incoming media tracks
  const handleTrack = (event) => {
    setRemoteStream(event.streams[0]); // Update remote stream state with the received stream
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = event.streams[0]; // Display the received stream in the remote video element
    }
  };

  const displayMediaOptions = {
    video: {
      displaySurface: "browser",
    },
    audio: {
      suppressLocalAudioPlayback: false,
    },
    preferCurrentTab: false,
    selfBrowserSurface: "include",
    systemAudio: "include",
    surfaceSwitching: "exclude",
    monitorTypeSurfaces: "include",
  };
  
  const startCapture = async (displayMediaOptions) => {
    let captureStream;
  
    try {
      captureStream =
        await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    } catch (err) {
      console.error(`Error: ${err}`);
    }
    return captureStream;
  }
  

    return (
    <div>
      <h2>Home</h2>
      <div>
        <h3>Your Video</h3>
        <video ref={localVideoRef} autoPlay playsInline />
      </div>
      <div>
        <h3>Remote Video</h3>
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>
      <button onClick={toggleVideo}>{isVideoOn ? "Turn Off Video" : "Turn On Video"}</button>
      <button onClick={startConnection}>Start Connection</button>
      <button onClick={devicesList}>List Devices</button>
      <button onClick={() => startCapture(displayMediaOptions)}>Start Record</button>
      <button onClick={constraints}>Display Constraints</button>
    </div>
    );
};
export default Home;