"use client"

import {useEffect, useRef, useState} from "react";
import {
  LocalAudioStream,
  LocalVideoStream,
  P2PRoom,
  RemoteAudioStream,
  RemoteVideoStream, RoomPublication,
  SkyWayContext,
  SkyWayRoom,
  SkyWayStreamFactory
} from "@skyway-sdk/room";

export default function Host() {
  const [token, setToken] = useState<string | null>(null);
  const [room, setRoom] = useState<P2PRoom | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [joiningRoom, setJoiningRoom] = useState<boolean>(false);
  const [showConversation, setShowConversation] = useState<boolean>(false);

  const [meId, setMeId] = useState<string | null>(null);
  const [meAudioPublication, setMeAudioPublication] = useState<RoomPublication<LocalAudioStream> | null>(null);
  const [meVideoPublication, setMeVideoPublication] = useState<RoomPublication<LocalVideoStream> | null>(null);

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
      const meAudioPublication = await me.publish(audio);
      setMeAudioPublication(meAudioPublication);
      const meVideoPublication = await me.publish(video);
      setMeVideoPublication(meVideoPublication);

      const subscribeAndAttach = (publication: RoomPublication) => {
        // 自分の publication は subscribe しない
        if (publication.publisher.id === me.id) {
          return;
        }
        me.subscribe(publication.id).then(({ stream }) => {
          if (stream instanceof RemoteVideoStream || stream instanceof RemoteAudioStream) {
            stream.attach(remoteVideoRef.current);
            remoteVideoRef.current.play();
            setShowConversation(true);
          }
        })
      }

      // room にすでに存在する publication を subscribe し、新たに publish されたら subscribe するようイベントハンドラ設定
      room.publications.forEach(subscribeAndAttach);
      room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
    })();
  }, [room]);

  // join クリック
  const onJoin = async () => {
    if (room) {
      return;
    }
    setJoiningRoom(true);
  }

  const onConversation = async () => {
    const remoteMember = room.members.find((member) => member.id !== meId)
    await remoteMember.subscribe(meAudioPublication.id);
    await remoteMember.subscribe(meVideoPublication.id);
  }

  return <>
    <p>Host page</p>
    <div>
      room name: <input id="room-name" type="text" onChange={
      (ev) => {
        setRoomName(ev.target.value)
      }
    } disabled={joiningRoom}/>
      <div>
        <button id="join" disabled={!token || !roomName || joiningRoom} onClick={onJoin}>join</button>
        <button id="conversation" disabled={!showConversation} onClick={onConversation}>通話開始</button>
      </div>
    </div>
    <video id="local-video" ref={localVideoRef} width="400px" muted playsInline/>
    <video id="remote-video" ref={remoteVideoRef} width="400px" muted playsInline/>
  </>
}

async function createToken() {
  const res = await fetch("/api/tokens/hosts", {
    method: "POST",
  });
  const { token } = await res.json();
  return token;
}
