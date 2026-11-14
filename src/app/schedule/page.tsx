import MonthCalendar from "@/components/MonthCalendar";
import BookedList from "@/components/BookedList";
import { listAppointments, monthSlots } from "@/lib/store";

// Server-rendered from the in-memory demo store so the calendar and booked
// list appear in the HTML immediately; client components keep them live.
export const dynamic = "force-dynamic";

export default function SchedulePage() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const days = monthSlots(month);
  const appointments = listAppointments();

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appointment Schedule</h1>
        <p className="text-sm text-[#8a8f98]">
          Booked slots only — the agent offers open times from the same calendar.{" "}
          <span className="demo-tag">demo data</span>
        </p>
      </div>

      <MonthCalendar initialDays={days} initialMonth={month} />

      <BookedList initialAppointments={appointments} />
    </div>
  );
}
