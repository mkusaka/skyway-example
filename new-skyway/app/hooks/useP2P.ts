import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { RemoteAudioStream, RemoteVideoStream } from "@skyway-sdk/room";
import { createSkywayWrapper, Role } from "../lib/skyway";

export function useP2P(
  localVideoRef: MutableRefObject<HTMLVideoElement>,
  remoteVideoRef: MutableRefObject<HTMLVideoElement>,
  role: Role,
) {
  const [isLocalMemberJoining, setIsLocalMemberJoining] = useState(false);
  const [isRemoteMemberJoining, setIsRemoteMemberJoining] = useState(false);
  const [isInConversation, setIsInConversation] = useState(false);
  
  const wrapperRef = useRef<ReturnType<typeof createSkywayWrapper>>();
  const localStreamsRef = useRef<{ audio: any; video: any } | null>(null);
  const remoteStreamsRef = useRef<{ audio: RemoteAudioStream | null; video: RemoteVideoStream | null }>({
    audio: null,
    video: null,
  });

  const joinSession = useCallback(async (roomId: string, token: string) => {
    if (isLocalMemberJoining) return;

    const wrapper = createSkywayWrapper({ roomId, token, role });
    wrapperRef.current = wrapper;

    wrapper.on("onMemberJoined", () => setIsRemoteMemberJoining(true));
    wrapper.on("onMemberLeft", () => {
      setIsRemoteMemberJoining(false);
      setIsInConversation(false);
    });
    
    if (role === "guest") {
      wrapper.on("onSubscribed", (stream) => {
        if (stream instanceof RemoteAudioStream) {
          remoteStreamsRef.current.audio = stream;
        } else if (stream instanceof RemoteVideoStream) {
          remoteStreamsRef.current.video = stream;
        }
        setIsInConversation(true);
        attachRemoteStreams();
      });
    }

    await wrapper.init();
    setIsLocalMemberJoining(true);

    const streams = await wrapper.publishLocalStreams();
    if (streams) {
      localStreamsRef.current = streams;
      streams.video.attach(localVideoRef.current);
      await localVideoRef.current.play();
    }
  }, [isLocalMemberJoining, localVideoRef, role]);

  const leaveSession = useCallback(async () => {
    if (!wrapperRef.current || !isLocalMemberJoining) return;

    if (localStreamsRef.current) {
      localStreamsRef.current.video.detach();
    }
    if (remoteStreamsRef.current.video) {
      remoteStreamsRef.current.video.detach();
    }
    if (remoteStreamsRef.current.audio) {
      remoteStreamsRef.current.audio.detach();
    }

    await wrapperRef.current.leave();
    wrapperRef.current = undefined;
    localStreamsRef.current = null;
    remoteStreamsRef.current = { audio: null, video: null };
    
    setIsLocalMemberJoining(false);
    setIsRemoteMemberJoining(false);
    setIsInConversation(false);
  }, [isLocalMemberJoining]);

  const startConversation = useCallback(async () => {
    if (!wrapperRef.current || role !== "host") return;
    await wrapperRef.current.subscribeToRemoteStreams();
    setIsInConversation(true);
  }, [role]);

  const attachRemoteStreams = useCallback(async () => {
    const { video, audio } = remoteStreamsRef.current;
    if (video) {
      video.attach(remoteVideoRef.current);
      await remoteVideoRef.current.play();
    }
    if (audio) {
      audio.attach(remoteVideoRef.current);
      await remoteVideoRef.current.play();
    }
  }, [remoteVideoRef]);

  return {
    isLocalMemberJoining,
    isRemoteMemberJoining,
    isInConversation,
    joinSession,
    leaveSession,
    ...(role === "host" ? { startConversation } : {}),
  };
} 