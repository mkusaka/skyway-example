"use client"

import {useP2PGuest, useP2PHost} from "./useP2P";
import {useCallback, useRef, useState} from "react";

export default function Guest() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    isLocalMemberJoining,
    joinSession,
    leaveSession,
  } = useP2PGuest(
    localVideoRef,
    remoteVideoRef,
  );

  const join = useCallback(async () => {
    if (!roomId) {
      return
    }
    const token = await createToken();
    await joinSession(roomId, token);
  }, [roomId])

  return <>
    <p>Guest page</p>
    <div>
      room id:
      <input id="room-id" type="text" value={roomId || ""} onChange={ev => setRoomId(ev.target.value)}
             disabled={isLocalMemberJoining}/>
      <div>
        <button id="join" disabled={isLocalMemberJoining} onClick={join}>
          join
        </button>
        <button id="leave" disabled={!isLocalMemberJoining} onClick={leaveSession}>
          leave
        </button>
      </div>
    </div>
    <video id="local-video" ref={localVideoRef} muted playsInline/>
    <video id="remote-video" ref={remoteVideoRef} playsInline/>
  </>
}

async function createToken() {
  const res = await fetch("/api/tokens/guests", {
    method: "POST",
  });
  const { token } = await res.json();
  return token;
}
