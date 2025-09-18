import FullCalendar from "@fullcalendar/react";
import { EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useEffect, useState, useRef } from "react";

interface CalendarViewProps {
  refresh?: number;
}

export default function CalendarView({ refresh }: CalendarViewProps) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const calendarRef = useRef<FullCalendar | null>(null);

  const fetchEvents = async () => {
    const res = await fetch("/api/events");
    const data = await res.json();

    const formatted: EventInput[] = data.map((e: any) => ({
      title: e.summary,
      start: e.start.dateTime || e.start.date,
      end: e.end.dateTime || e.end.date,
      extendedProps: {
        description: e.description || "",
        location: e.location || "",
      },
    }));
    setEvents(formatted);
  };

  useEffect(() => {
    fetchEvents();
  }, [refresh]); // <--- re-fetch when `refresh` changes

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin]}
      initialView="dayGridMonth"
      events={events}
      eventDidMount={(info) => {
        const { description, location } = info.event.extendedProps as any;
        info.el.setAttribute("title", `${description}\nLocation: ${location}`);
      }}
    />
  );
}

