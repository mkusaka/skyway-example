"use client"

import Peer from 'skyway-js';
import {useEffect, useRef, useState} from "react";

export default function Page() {
  const apiKey = process.env.NEXT_PUBLIC_SKYWAY_API_KEY;
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [theirId, setTheirId] = useState<string | null>(null);
  const [remotePeerId, setRemotePeerId] = useState<string | null>(null);

  const myVideoRef = useRef(null)
  const theirVideoRef = useRef(null)

  // 発信処理
  useEffect(() => {
    // カメラ映像取得
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        // 成功時にvideo要素にカメラ映像をセットし、再生
        myVideoRef.current.srcObject = stream;
        myVideoRef.current.play();
        // 着信時に相手にカメラ映像を返せるように、変数に保存しておく
        setLocalStream(stream)
      }).catch(error => {
      // 失敗時にはエラーログを出力
      console.error('mediaDevice.getUserMedia() error:', error);
      return;
    });
  }, []);

  useEffect(() => {
    if (!localStream) {
      return
    }
    const peer = new Peer({ key: apiKey });
    peer.on('open', () => {
      setPeerId(peer.id);
    });
    peer.on('call', mediaConnection => {
      mediaConnection.answer(localStream);
      setRemotePeerId(mediaConnection.remoteId)
      mediaConnection.on('stream', stream => {
        // video要素にカメラ映像をセットして再生
        theirVideoRef.current.srcObject = stream;
        theirVideoRef.current.play();
      });
    });
    setPeer(peer);
  }, [localStream]);

  const onMakeCall = () => {
    const mediaConnection = peer.call(theirId, localStream);
    setRemotePeerId(mediaConnection.remoteId)
    mediaConnection.on('stream', stream => {
      // video要素にカメラ映像をセットして再生
      theirVideoRef.current.srcObject = stream;
      theirVideoRef.current.play();
    });
  }

  return <>
    <video id="my-video" ref={myVideoRef} width="400px" autoPlay muted playsInline></video>
    <div>
      <p>My Peer-ID: {peerId}</p>
      <input id="their-id" placeholder="Their Peer-ID" onChange={ev => {
        setTheirId(ev.target.value)
      }}>
      </input>
      <button id="make-call" onClick={onMakeCall}>発信
      </button>
    </div>
    <video id="their-video" ref={theirVideoRef} width="400px" autoPlay muted playsInline></video>
    <div>
      <p>Remote Peer-ID: {remotePeerId}</p>
    </div>
  </>
}
