import {
  LocalAudioStream,
  LocalP2PRoomMember,
  LocalVideoStream,
  P2PRoom,
  RemoteAudioStream,
  RemoteVideoStream,
  RoomPublication,
  SkyWayContext,
  SkyWayRoom,
  SkyWayStreamFactory,
} from "@skyway-sdk/room";

export type Role = "host" | "guest";

export interface SkywayWrapperOptions {
  roomId: string;
  token: string;
  role: Role;
}

export interface SkywayEvents {
  onMemberJoined?: (member: any) => void;
  onMemberLeft?: (member: any) => void;
  onStreamPublished?: (publication: RoomPublication) => void;
  onSubscribed?: (stream: RemoteAudioStream | RemoteVideoStream) => void;
}

export function createSkywayWrapper(options: SkywayWrapperOptions) {
  let room: P2PRoom | null = null;
  let localMember: LocalP2PRoomMember | null = null;
  let localStreams: { audio: LocalAudioStream; video: LocalVideoStream } | null = null;
  
  const events: SkywayEvents = {};

  async function init() {
    const context = await SkyWayContext.Create(options.token);
    room = await SkyWayRoom.FindOrCreate(context, {
      type: "p2p",
      name: options.roomId,
    });
    localMember = await room.join({ name: options.role });
    
    room.onMemberJoined.add((ev) => {
      if (ev.member.name !== options.role) {
        events.onMemberJoined?.(ev.member);
      }
    });

    room.onMemberLeft.add((ev) => {
      if (ev.member.name !== options.role) {
        events.onMemberLeft?.(ev.member);
      }
    });

    room.onStreamPublished.add((ev) => {
      if (ev.publication.publisher.name !== options.role) {
        events.onStreamPublished?.(ev.publication);
      }
    });

    if (localMember && options.role === "guest") {
      localMember.onPublicationSubscribed.add(({ stream }) => {
        if (stream instanceof RemoteAudioStream || stream instanceof RemoteVideoStream) {
          events.onSubscribed?.(stream);
        }
      });
    }
  }

  async function publishLocalStreams() {
    if (!localMember) return null;
    
    const streams = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
    await localMember.publish(streams.audio);
    await localMember.publish(streams.video);
    localStreams = streams;
    return streams;
  }

  async function subscribe(publicationId: string) {
    if (!localMember) return null;
    return await localMember.subscribe(publicationId);
  }

  async function subscribeToRemoteStreams() {
    if (!room || !localMember || options.role !== "host") return;
    
    const remoteMember = room.members.find(m => m.name !== "host");
    if (!remoteMember) return;
    
    room.publications.forEach(pub => {
      if (pub.publisher.name !== "host") {
        remoteMember.subscribe(pub.id);
      }
    });
  }

  async function leave() {
    if (localStreams) {
      localStreams.audio.release();
      localStreams.video.release();
      localStreams = null;
    }
    
    if (localMember) {
      await localMember.leave();
      localMember = null;
    }
    
    if (room) {
      await room.dispose();
      room = null;
    }
  }

  function on<K extends keyof SkywayEvents>(event: K, callback: SkywayEvents[K]) {
    events[event] = callback;
  }

  return {
    init,
    publishLocalStreams,
    subscribe,
    subscribeToRemoteStreams,
    leave,
    on,
  };
} 