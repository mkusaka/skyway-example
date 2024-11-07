"use client"

import {useP2PHost} from "./useP2P";
import {useCallback, useEffect, useRef, useState} from "react";

export default function Host() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    isLocalMemberJoining,
    isRemoteMemberJoining,
    isInConversation,
    joinSession,
    leaveSession,
    startConversation,
  } = useP2PHost(
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
    <p>Host page</p>
    <div>
      room id:
      <input id="room-id" type="text" value={roomId || ""} onChange={ev => setRoomId(ev.target.value)}
             disabled={isLocalMemberJoining}/>
      <div>
        <button id="join" disabled={isLocalMemberJoining} onClick={join}>
          join
        </button>
        <button id="conversation" disabled={!isLocalMemberJoining || !isRemoteMemberJoining || isInConversation} onClick={startConversation}>
          通話開始
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
  const res = await fetch("/api/tokens/hosts", {
    method: "POST",
  });
  const { token } = await res.json();
  return token;
}
