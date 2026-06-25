import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import viLocale from "@fullcalendar/core/locales/vi";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";

interface CalendarViewProps {
  bookings: any[];
  onUpdateStatus?: (bookingId: string, status: string) => Promise<void>;
  onReschedule?: (bookingId: string, date: string, time: string, note: string) => Promise<void>;
}

const CalendarView: React.FC<CalendarViewProps> = ({ bookings, onUpdateStatus, onReschedule }) => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleNote, setRescheduleNote] = useState("");

  // Map bookings to FullCalendar events
  const events = bookings.map((booking) => {
    const datePart = new Date(booking.bookingDate).toISOString().split("T")[0];
    const startTime = `${datePart}T${booking.bookingTime}:00`;

    let color = "#3b82f6"; // default blue
    if (booking.status === "confirmed") color = "#10b981"; // emerald
    if (booking.status === "pending") color = "#f59e0b"; // amber
    if (booking.status === "cancelled") color = "#ef4444"; // rose
    if (booking.status === "completed") color = "#6366f1"; // indigo
    if (booking.status === "landlord_proposed") color = "#a855f7"; // purple
    if (booking.status === "tenant_rejected") color = "#f43f5e"; // rose/red

    return {
      id: booking._id,
      title: `${booking.customerName} - ${booking.propertyId?.name || "Xem phòng"}`,
      start: startTime,
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        ...booking
      }
    };
  });

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event.extendedProps);
    setIsRescheduling(false);
    setNewDate(info.event.extendedProps.bookingDate.split("T")[0]);
    setNewTime(info.event.extendedProps.bookingTime);
    setRescheduleNote("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Đã xác nhận</span>;
      case "pending":
        return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Đang chờ</span>;
      case "cancelled":
        return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Đã huỷ</span>;
      case "completed":
        return <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Hoàn thành</span>;
      case "landlord_proposed":
        return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Đã đề xuất</span>;
      case "tenant_rejected":
        return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Khách từ chối</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[40px] p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        {/* Header decoration */}
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Calendar className="size-64 text-indigo-600" />
        </div>

        <div className="relative z-10">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            locale={viLocale}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              meridiem: false,
              hour12: false
            }}
            eventClassNames="cursor-pointer hover:scale-[1.02] transition-transform duration-200 font-bold border-none shadow-sm rounded-lg"
          />
        </div>
      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 p-8 text-white relative">
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
                >
                  <XCircle className="size-8" />
                </button>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                    <Calendar className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Chi tiết lịch hẹn</h3>
                    <p className="text-white/80 font-bold text-sm">Quản lý yêu cầu xem phòng</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-2xl font-black text-slate-800 mb-2">
                       {selectedEvent.propertyId?.name || "Căn hộ/Phòng trọ"}
                    </h4>
                    <p className="text-slate-400 font-bold flex items-center gap-2 text-sm">
                      <MapPin className="size-4" />
                      {selectedEvent.propertyId?.address || "Hồ Chí Minh"}
                    </p>
                  </div>
                  {getStatusBadge(selectedEvent.status)}
                </div>

                {!isRescheduling ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-inner">
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Thời gian</p>
                        <p className="font-black text-slate-900 flex items-center gap-3">
                          <Clock className="size-5 text-emerald-500" />
                          {selectedEvent.bookingTime} • {new Date(selectedEvent.bookingDate).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Khách hàng</p>
                        <p className="font-black text-slate-900 flex items-center gap-3">
                          <User className="size-5 text-blue-500" />
                          {selectedEvent.customerName}
                        </p>
                        <p className="text-xs font-bold text-slate-400 ml-8 flex items-center gap-2">
                          <Phone className="size-3" /> {selectedEvent.customerPhone}
                        </p>
                      </div>
                    </div>

                    {selectedEvent.note && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                          <FileText className="size-3" /> Ghi chú
                        </p>
                        <p className="text-sm text-slate-600 font-medium italic bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex-1">
                          "{selectedEvent.note}"
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4 bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                    <h5 className="font-bold text-slate-800">Đề xuất lịch hẹn mới</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Ngày hẹn</label>
                        <input 
                          type="date" 
                          className="w-full rounded-xl border-slate-200 p-2 text-sm"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Giờ hẹn</label>
                        <input 
                          type="time" 
                          className="w-full rounded-xl border-slate-200 p-2 text-sm"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Lời nhắn cho khách (tuỳ chọn)</label>
                      <textarea 
                        className="w-full rounded-xl border-slate-200 p-2 text-sm"
                        rows={2}
                        value={rescheduleNote}
                        onChange={(e) => setRescheduleNote(e.target.value)}
                        placeholder="Ví dụ: Xin lỗi, giờ đó tôi bận..."
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  {selectedEvent.status === "pending" && !isRescheduling && (
                    <>
                      <Button
                        variant="ghost"
                        className="flex-1 py-7 rounded-2xl font-black text-rose-500 hover:bg-rose-50 border-2 border-transparent hover:border-rose-100 transition-all text-sm"
                        onClick={async () => {
                          if (onUpdateStatus) {
                            await onUpdateStatus(selectedEvent._id, "cancelled");
                            setSelectedEvent(null);
                          }
                        }}
                      >
                        <XCircle className="size-4 mr-2" />
                        Từ chối
                      </Button>
                      <Button
                        className="flex-1 py-7 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-sm"
                        onClick={async () => {
                          if (onUpdateStatus) {
                            await onUpdateStatus(selectedEvent._id, "confirmed");
                            setSelectedEvent(null);
                          }
                        }}
                      >
                        <CheckCircle className="size-4 mr-2" />
                        Xác nhận
                      </Button>
                    </>
                  )}

                  {selectedEvent.status === "confirmed" && !isRescheduling && (
                    <Button
                      className="w-full py-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 transition-all hover:scale-[1.02] active:scale-95"
                      onClick={async () => {
                        if (onUpdateStatus) {
                          await onUpdateStatus(selectedEvent._id, "completed");
                          setSelectedEvent(null);
                        }
                      }}
                    >
                      <CheckCircle className="size-5 mr-2" />
                      Hoàn thành xem phòng
                    </Button>
                  )}

                  {(selectedEvent.status === "tenant_rejected" || selectedEvent.status === "cancelled") && !isRescheduling && (
                    <Button
                      className="w-full py-7 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black shadow-xl shadow-purple-100 transition-all hover:scale-[1.02] active:scale-95"
                      onClick={() => setIsRescheduling(true)}
                    >
                      <Calendar className="size-5 mr-2" />
                      Hẹn lịch khác
                    </Button>
                  )}

                  {isRescheduling && (
                    <>
                      <Button
                        variant="ghost"
                        className="flex-1 py-7 rounded-2xl font-black text-slate-400 hover:bg-slate-50 border-2 border-slate-100"
                        onClick={() => setIsRescheduling(false)}
                      >
                        Huỷ
                      </Button>
                      <Button
                        className="flex-1 py-7 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                        onClick={async () => {
                          if (onReschedule && newDate && newTime) {
                            await onReschedule(selectedEvent._id, newDate, newTime, rescheduleNote);
                            setSelectedEvent(null);
                          }
                        }}
                        disabled={!newDate || !newTime}
                      >
                        Gửi đề xuất
                      </Button>
                    </>
                  )}

                  {(selectedEvent.status === "completed" || selectedEvent.status === "cancelled" || selectedEvent.status === "tenant_rejected" || selectedEvent.status === "landlord_proposed") && !isRescheduling && (
                    <Button
                      variant="ghost"
                      className="w-full py-7 rounded-2xl font-black text-slate-400 hover:bg-slate-50 border-2 border-slate-100"
                      onClick={() => setSelectedEvent(null)}
                    >
                      Đóng
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .fc {
          --fc-border-color: #f1f5f9;
          --fc-button-bg-color: #ffffff;
          --fc-button-border-color: #e2e8f0;
          --fc-button-text-color: #475569;
          --fc-button-active-bg-color: #3b82f6;
          --fc-button-active-border-color: #3b82f6;
          --fc-button-hover-bg-color: #f8fafc;
          --fc-today-bg-color: #eff6ff;
          font-family: inherit;
        }
        .fc .fc-toolbar-title {
          font-weight: 900;
          font-size: 1.5rem;
          background: linear-gradient(to r, #1e293b, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.025em;
        }
        .fc .fc-button {
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }
        .fc .fc-button-primary:not(:disabled):active, 
        .fc .fc-button-primary:not(:disabled).fc-button-active {
          background-color: #3b82f6;
          border-color: #3b82f6;
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
        }
        .fc .fc-event {
          padding: 4px 8px;
          margin: 2px 0;
        }
        .fc .fc-daygrid-day-number {
          font-weight: 800;
          color: #94a3b8;
          padding: 10px;
        }
        .fc .fc-col-header-cell-cushion {
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          color: #1e293b;
          padding: 15px;
        }
        .fc th {
          border-bottom: 2px solid #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
};

export default CalendarView;
