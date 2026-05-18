import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export default function VideoConsult() {
  const { appointmentId } = useParams();
  const [room, setRoom] = useState(null);

  useEffect(() => {
    api.get(`/appointments/${appointmentId}/video`).then((r) => setRoom(r.data));
  }, [appointmentId]);

  if (!room) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="page-shell max-w-5xl pb-16">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="badge mb-2 w-fit">Video</p>
          <h1 className="page-title text-2xl">Consultation room</h1>
          <p className="page-subtitle font-mono text-xs sm:text-sm">Room: {room.roomId}</p>
        </div>
        <a
          href={room.jitsiUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary shrink-0 text-sm"
        >
          Open in new tab
        </a>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-glow">
        <iframe
          title="Video consultation"
          src={room.jitsiUrl}
          className="aspect-video min-h-[480px] w-full"
          allow="camera; microphone; fullscreen; display-capture"
        />
      </div>
    </div>
  );
}
