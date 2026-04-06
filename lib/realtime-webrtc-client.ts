/**
 * Browser-only WebRTC handshake for OpenAI Realtime.
 * @see https://developers.openai.com/docs/guides/realtime-webrtc
 */

function waitForIceGatheringComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const done = () => {
      pc.removeEventListener("icegatheringstatechange", onState);
      resolve();
    };
    const onState = () => {
      if (pc.iceGatheringState === "complete") {
        done();
      }
    };
    pc.addEventListener("icegatheringstatechange", onState);
    setTimeout(done, 8000);
  });
}

export interface RealtimeVoiceConnection {
  disconnect: () => void;
}

export async function connectOpenAIRealtimeVoice(options: {
  clientSecret: string;
  onRemoteStream: (stream: MediaStream) => void;
}): Promise<RealtimeVoiceConnection> {
  const { clientSecret, onRemoteStream } = options;

  if (
    !clientSecret ||
    clientSecret === "missing-openai-api-key" ||
    !clientSecret.trim()
  ) {
    throw new Error(
      "No valid realtime session. Add OPENAI_API_KEY to .env.local and restart the dev server."
    );
  }

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) {
      onRemoteStream(stream);
    }
  };

  const mic = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true
    }
  });
  const [micTrack] = mic.getAudioTracks();
  if (micTrack) {
    pc.addTrack(micTrack, mic);
  }

  pc.createDataChannel("oai-events");

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForIceGatheringComplete(pc);

  const localSdp = pc.localDescription?.sdp;
  if (!localSdp) {
    mic.getTracks().forEach((t) => t.stop());
    pc.close();
    throw new Error("WebRTC failed to produce a local SDP offer.");
  }

  const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    body: localSdp,
    headers: {
      Authorization: `Bearer ${clientSecret}`,
      "Content-Type": "application/sdp"
    }
  });

  if (!sdpResponse.ok) {
    const errBody = await sdpResponse.text();
    mic.getTracks().forEach((t) => t.stop());
    pc.close();
    throw new Error(
      `OpenAI Realtime handshake failed (${sdpResponse.status}): ${errBody.slice(0, 500)}`
    );
  }

  const answerSdp = await sdpResponse.text();
  await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

  return {
    disconnect: () => {
      mic.getTracks().forEach((t) => t.stop());
      pc.getSenders().forEach((s) => s.track?.stop());
      pc.close();
    }
  };
}
