"use client"

import {useEffect, useRef, useState} from "react";
import {
  P2PRoom,
  RemoteAudioStream,
  RemoteVideoStream,
  SkyWayContext,
  SkyWayRoom,
  SkyWayStreamFactory
} from "@skyway-sdk/room";

export default function Attendee() {
  const [token, setToken] = useState<string | null>(null);
  const [room, setRoom] = useState<P2PRoom | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [joiningRoom, setJoiningRoom] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // token の作成
  useEffect(() => {
    (async () => {
      const token = await createToken();
      setToken(token);
    })();
  }, []);

  // room の作成 or 取得
  useEffect(() => {
    if (!joiningRoom || !!room) {
      return;
    }
    (async () => {
      // room の作成
      const context = await SkyWayContext.Create(token);
      const room = await SkyWayRoom.FindOrCreate(context, {
        type: "p2p",
        name: roomName,
      });
      setRoom(room)
    })();
  }, [joiningRoom]);

  // 音声通話のパブリッシュ
  useEffect(() => {
    if (!room) {
      return;
    }
    (async () => {
      // カメラ映像取得
      const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
      video.attach(localVideoRef.current);
      await localVideoRef.current.play();

      // room に参加し映像音声ストリームをパブリッシュ
      const me = await room.join();
      await me.publish(audio);
      await me.publish(video);

      me.onPublicationSubscribed.add(({ subscription, stream }) => {
        if (stream instanceof RemoteVideoStream || stream instanceof RemoteAudioStream) {
          stream.attach(remoteVideoRef.current);
          remoteVideoRef.current.play();
        }
      })
    })();
  }, [room]);

  // join クリック
  const onJoin = async () => {
    if (room) {
      return;
    }
    setJoiningRoom(true);
  }

  return <>
    <p>Attendee page</p>
    <div>
      room name: <input id="room-name" type="text" onChange={
      (ev) => {
        setRoomName(ev.target.value)
      }
    } disabled={joiningRoom}/>
      <div>
        <button id="join" disabled={!token || !roomName || joiningRoom} onClick={onJoin}>join</button>
      </div>
    </div>
    <video id="local-video" ref={localVideoRef} width="400px" muted playsInline/>
    <video id="remote-video" ref={remoteVideoRef} width="400px" muted playsInline/>
  </>
}

async function createToken() {
  const res = await fetch("/api/tokens/attendees", {
    method: "POST",
  });
  const { token } = await res.json();
  return token;
}
