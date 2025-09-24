import FullCalendar from "@fullcalendar/react";
import { EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from '@fullcalendar/list'
import { useEffect, useState, useRef } from "react";

import "./CalendarView.css"

interface CalendarViewProps {
  refresh?: number;
}

const API_BASE =
  import.meta.env.MODE === "production"
    ? "https://syllabus-to-calendar-yjkk.onrender.com"  // Render backend URL
    : import.meta.env.VITE_API_BASE_URL;               // Local dev


export default function CalendarView({ refresh }: CalendarViewProps) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const calendarRef = useRef<FullCalendar | null>(null);

  const fetchEvents = async () => {
    const res = await fetch(`${API_BASE}/api/events`, {credentials: "include"});
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
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
      initialView="dayGridMonth"
      fixedWeekCount={false}
      headerToolbar={{
        left: "dayGridMonth,dayGridWeek,timeGridDay",
        center: "title",
        right: "prev,next today"
      }}
      events={events}
      eventDidMount={(info) => {
        const { description, location } = info.event.extendedProps as any;
        info.el.setAttribute("title", `${description}\nLocation: ${location}`);
      }}
      windowResize={(arg) => {
        const width = window.innerWidth
        const calendar = arg.view.calendar
        if (width < 768 && calendar.view.type !== "listWeek") {
          calendar.changeView("listWeek")
        } else if (width >= 768 && calendar.view.type !== "dayGridMonth") {
          calendar.changeView('dayGridMonth')
        }
      }}
    />
  );
}

