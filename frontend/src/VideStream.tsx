import { useRef, useState } from 'react';
import { socket } from './socket';

const Stream = () => {
  const videoRef = useRef<any>(null);
  const [streaming, setStreaming] = useState(false);
  const mediaRecorderRef = useRef<any>(null);
  const recordedChunks = useRef<any>([]);

  const [savedVideo, setSavedVideo] = useState<string | undefined>(undefined)

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
        socket.emit('stream-data', event.data);
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

  return (
    <div>
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
