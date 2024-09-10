import { useEffect, useRef } from "react";
import { socket } from "./socket";

export function Player() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);

  useEffect(() => {
    function setupMediaSource() {
      if (!videoRef.current) return;
      const videoElement = videoRef.current;

      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;

      mediaSource.addEventListener('sourceopen', () => {
        const sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8, vorbis"');
        sourceBufferRef.current = sourceBuffer;

        sourceBuffer.addEventListener('updateend', () => {
          if (videoElement.readyState >= 3) {
            videoElement.play().catch(console.error);
          }
        });
      });

      videoElement.src = URL.createObjectURL(mediaSource);
    }

    setupMediaSource();
    
    return () => {
      if (videoRef.current) URL.revokeObjectURL(videoRef.current.src);
    };
  }, []);

  useEffect(() => {
    function handleOnStreamEvent(arrayBuffer: ArrayBuffer) {
      if (sourceBufferRef.current && !sourceBufferRef.current.updating) sourceBufferRef.current.appendBuffer(arrayBuffer);
    }

    socket.on("stream", handleOnStreamEvent);

    return () => {
      // socket.off("stream", handleOnStreamEvent);
      // socket.disconnect();
    };
  }, []);

  return (
    <video ref={videoRef} style={{ width: '600px', height: '400px' }} controls />
  );
}
