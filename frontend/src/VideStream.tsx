import { useRef, useState } from 'react';
import { socket } from './socket';

const Stream = () => {
  const [savedVideo, setSavedVideo] = useState<string | undefined>(undefined)
  const [streaming, setStreaming] = useState(false);
  const [roomId, setRoomId] = useState<string | undefined>(undefined)

  const videoRef = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null)
  const recordedChunks = useRef<any>([]);

  // Start the video stream
  const startStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();

    // Emit video data via Socket.IO
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorderRef.current.ondataavailable = (event: any) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
        socket.emit('stream-data', event.data);
      }
    };

    mediaRecorderRef.current.start(200); // Send chunks every 200ms
    setStreaming(true);
  };

  const startScreenStream = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();

    // Emit video data via Socket.IO
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorderRef.current.ondataavailable = (event: any) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
        if (roomId) socket.emit('stream-data', roomId, event.data);
      }
    };

    mediaRecorderRef.current.start(200); // Send chunks every 200ms
    setStreaming(true);
  };

  // Stop the video stream
  const stopStream = () => {
    mediaRecorderRef.current.stop();
    const tracks = videoRef.current.srcObject.getTracks();
    tracks.forEach((track: any) => track.stop());

    setStreaming(false);
    socket.emit('stop-stream');
  };

  // Save the recorded video
  const saveVideo = async () => {
    const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
    const formData = new FormData();
    formData.append('video', blob, 'recorded-video.webm');

    // Save video
    await fetch('http://localhost:3000/save-video', {
      method: 'POST',
      body: formData
    });

    const url = URL.createObjectURL(blob)

    setSavedVideo(url)

    recordedChunks.current = [];
  };

  function handleOnJoin() {
    if (inputRef.current && inputRef.current.value) {
      setRoomId(inputRef.current.value)
      socket.emit("stream:join", inputRef.current.value)
    }
  }

  return (
    <div>

      {roomId ? `Connected to ${roomId}` : null}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "start",
      }}>
        <input type='text' ref={inputRef} />
        <button onClick={handleOnJoin}>Join</button>
      </div>

      <video ref={videoRef} style={{ width: '600px', height: '400px' }} />
      <div>
        {!streaming ? (
          <>
          <button onClick={startScreenStream}>Start Screen Streaming</button>
          <button onClick={startStream}>Start Streaming</button>
          </>
        ) : (
          <button onClick={stopStream}>Stop Streaming</button>
        )}
        <button onClick={saveVideo}>Save Video</button>
      </div>

      {savedVideo ? savedVideo : null}
    </div>
  );
};

export default Stream;
