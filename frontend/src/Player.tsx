import { useEffect, useRef } from "react";
import { socket } from "./socket";


/// Utils function
function concatArrayBuffer(buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLen = buffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
  const tempArray = new Uint8Array(totalLen);
  let offset = 0
  buffers.forEach(buffer => {
    tempArray.set(new Uint8Array(buffer), offset)
    offset += buffer.byteLength
  });
  return tempArray.buffer
}


export function Player() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const hasInitialData = useRef(false); // To track if we have initial stream data

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
    function handleOnStreamEvent(_arrayBuffer: ArrayBuffer, buffers: ArrayBuffer[]) {
      if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
        // sourceBufferRef.current.appendBuffer(arrayBuffer);
        sourceBufferRef.current.appendBuffer(concatArrayBuffer(buffers));
        hasInitialData.current = true; // Mark that data has been received
      }
    }

    socket.on("stream", handleOnStreamEvent);

    return () => {
      // socket.off("stream", handleOnStreamEvent);
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
