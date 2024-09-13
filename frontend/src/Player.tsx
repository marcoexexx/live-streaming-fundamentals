import { useEffect, useRef } from "react";
import { socket } from "./socket";

export function Player() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const hasInitialData = useRef(false); // To track if we have initial stream data
  const isViewRef = useRef(false);

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
          if (hasInitialData.current && videoElement.readyState >= 3 && !videoElement.paused) {
            // Only play the video if it's not already paused
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
    function handleOnStreamEvent(arrayBuffer: ArrayBuffer, buffers: ArrayBuffer[]) {
      if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
        if ((mediaSourceRef.current?.sourceBuffers?.length || 0) > 0) {

          if (videoRef.current) {
            if (isViewRef.current) {
              sourceBufferRef.current.appendBuffer(arrayBuffer);
              hasInitialData.current = true; // Mark that data has been received
            } else {
              buffers.forEach(buf => {
                if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
                  sourceBufferRef.current.appendBuffer(buf);
                }
              })
              hasInitialData.current = true; // Mark that data has been received
              isViewRef.current = true
              console.log(URL.createObjectURL((new Blob(buffers, {type: "video/webm"}))))
            }
          };

        }
      }
    }

    socket.on("stream", handleOnStreamEvent);

    return () => {
      socket.off("stream", handleOnStreamEvent);
    };
  }, []);

  function handlePlay() {
    if (videoRef.current && videoRef.current.readyState >= 3) {
      videoRef.current.play().catch(console.error);
    }
  }

  return (
    <video
      ref={videoRef}
      style={{ width: '600px', height: '400px' }}
      controls
      onPlay={handlePlay} // Play the video when the user hits play
    />
  );
}
