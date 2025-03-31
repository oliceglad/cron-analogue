import { FormEvent, Fragment, useId, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { formatDate } from "../utils/formatDate";
import { cc } from "../utils/cc";
import { EVENT_COLORS, useEvents } from "../context/useEvent";
import { Modal, ModalProps } from "./Modal";
import { UnionOmit } from "../utils/types";
import { Event } from "../context/Events";
import { OverflowContainer } from "./OverflowContainer";

export function Calendar() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const firstWeekStart = startOfWeek(startOfMonth(selectedMonth));
    const lastWeekEnd = endOfWeek(endOfMonth(selectedMonth));

    return eachDayOfInterval({ start: firstWeekStart, end: lastWeekEnd });
  }, [selectedMonth]);

  const { events } = useEvents();

  return (
    <div className="calendar">
      <div className="header">
        <button className="btn" onClick={() => setSelectedMonth(new Date())}>
          Сегодня
        </button>
        <div>
          <button
            className="month-change-btn"
            onClick={() => setSelectedMonth((m) => subMonths(m, 1))}
          >
            &lt;
          </button>
          <button
            className="month-change-btn"
            onClick={() => setSelectedMonth((m) => addMonths(m, 1))}
          >
            &gt;
          </button>
        </div>
        <span className="month-title">
          {formatDate(selectedMonth, { month: "long", year: "numeric" })}
        </span>
      </div>

      <div className="days">
        {calendarDays.map((day, index) => (
          <CalendarDay
            key={day.getTime()}
            day={day}
            showWeekName={index < 7}
            selectedMonth={selectedMonth}
            events={events.filter((event) => isSameDay(day, event.date))}
          />
        ))}
      </div>
    </div>
  );
  {
    /* <div key={day.getTime()} className='day non-month-day old-month-day'>
    <div className='day-header'>
      <div className='week-name'>Sun</div>
      <div className='day-number'>28</div>
      <button className='add-event-btn'>+</button>
    </div>
  </div>
  <div className='events'>
    <button className='all-day-event blue event'>
      <div className='event-name'>Short</div>
    </button>
    <button className='all-day-event green event'>
      <div className='event-name'>Long Event Name That Just Keeps Going</div>
    </button>
    <button className='event'>
      <div className='color-dot blue'></div>
      <div className='event-time'>7am</div>
      <div className='event-name'>Event Name</div>
    </button>
  </div> */
  }
}

type CalendarDayProps = {
  day: Date;
  showWeekName: boolean;
  selectedMonth: Date;
  events: Event[];
};

function CalendarDay({
  day,
  showWeekName,
  selectedMonth,
  events,
}: CalendarDayProps) {
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);

  const [isViewMoreEventModalOpen, setIsViewMoreEventModalOpen] =
    useState(false);

  const { addEvent } = useEvents();

  const sortedEvents = useMemo(() => {
    const timeToNumber = (time: string) => parseFloat(time.replace(":", "."));

    return [...events].sort((a, b) => {
        return timeToNumber(a.startTime) - timeToNumber(b.startTime);
    });
  }, [events]);

  return (
    // <div className='day non-month-day old-month-day'>
    <div
      className={cc(
        "day",
        !isSameMonth(day, selectedMonth) && "non-month-day",
        isBefore(endOfDay(day), new Date()) && "old-month-day"
      )}
    >
      <div className="day-header">
        {showWeekName && (
          <div className="week-name">
            {formatDate(day, {
              weekday: "short",
            })}
          </div>
        )}
        <div className={cc("day-number", isToday(day) && "today")}>
          {formatDate(day, {
            day: "numeric",
          })}
        </div>

        <button
          className="add-event-btn"
          onClick={() => setIsNewEventModalOpen(true)}
        >
          +
        </button>
      </div>
      {sortedEvents.length > 0 && (
        <OverflowContainer
          className="events"
          items={sortedEvents}
          getKey={(event) => event.id}
          renderItem={(event) => <CalendarEvent event={event} />}
          renderOverflow={(amount) => (
            <>
              <button
                onClick={() => setIsViewMoreEventModalOpen(true)}
                className="events-view-more-btn"
              >
                +{amount} More
              </button>
              <ViewMoreCalendarEventsModal
                events={sortedEvents}
                isOpen={isViewMoreEventModalOpen}
                onClose={() => setIsViewMoreEventModalOpen(false)}
              />
            </>
          )}
        />
      )}
      <EventFormModal
        date={day}
        isOpen={isNewEventModalOpen}
        onClose={() => setIsNewEventModalOpen(false)}
        onSubmit={addEvent}
      />
    </div>
  );
}

type ViewMoreCalendarEventsModalProps = {
  events: Event[];
  // isOpen: boolean;
  // onClose: () => void;
} & Omit<ModalProps, "children">;

function ViewMoreCalendarEventsModal({
  events,
  ...modalProps
}: ViewMoreCalendarEventsModalProps) {
  if (events.length === 0) return null;
  return (
    <Modal {...modalProps}>
      <div className="modal-title">
        <small>{formatDate(events[0].date, { dateStyle: "short" })}</small>
        <button className="close-btn" onClick={modalProps.onClose}>
          &times;
        </button>
      </div>
      <div className="events">
        {events.map((event) => (
          <CalendarEvent event={event} key={event.id} />
        ))}
      </div>
    </Modal>
  );
}

function CalendarEvent({ event }: { event: Event }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { updateEvent, deleteEvent } = useEvents();

  return (
    <>
      <button
        onClick={() => setIsEditModalOpen(true)}
        className={cc("event", event.color)}
      >
        <div className={`color-dot ${event.color}`}></div>
        <div className="event-time">
          {formatDate(parse(event.startTime, "HH:mm", event.date), {
            timeStyle: "short",
          })}
        </div>
        <div className="event-name">{event.name}</div>
      </button>
      <EventFormModal
        event={event}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={(e) => updateEvent(event?.id, e)}
        onDelete={() => deleteEvent(event?.id)}
      />
    </>
  );
}

type EventFormModalProps = {
  onSubmit: (event: UnionOmit<Event, "id">) => void;
  // onDelete: (id: string) => void;
} & (
  | {
      onDelete: () => void;
      event: Event;
      date?: never;
    }
  | {
      onDelete?: never;
      event?: never;
      date: Date;
    }
) &
  Omit<ModalProps, "children">;

function EventFormModal({
  onSubmit,
  onDelete,
  event,
  date,
  ...modalProps
}: EventFormModalProps) {
  const isNew = event == null;
  const formId = useId();
  const [selectedColor, setSelectedColor] = useState(
    event?.color || EVENT_COLORS[0]
  );

  const [startTime, setStartTime] = useState(event?.startTime || "");
  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);
  const [taskType, setTaskType] = useState("Написать письмо коллеге");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const name = nameRef.current?.value;
    const desc = descRef.current?.value;
    console.log("🚀 ~ handleSubmit ~ name:", name);
    if (name == null || name === "") return;

    const commonProps = {
      name,
      desc: event?.desc ?? desc,
      date: date || event?.date,
      color: selectedColor,
      taskType,
    };
    let newEvent: UnionOmit<Event, "id">;

    newEvent = {
      ...commonProps,
      startTime,
    };

    modalProps.onClose();
    onSubmit(newEvent);
    console.log(newEvent);
  }

  return (
    <Modal {...modalProps}>
      <div className="modal-title">
        <div>{isNew ? "Добавить" : "Редактировать"} задачу</div>
        <small>{formatDate(date || event.date, { dateStyle: "short" })}</small>
        <button className="close-btn" onClick={modalProps.onClose}>
          &times;
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor={`${formId}-name`}>Название</label>
          <input
            required
            defaultValue={event?.name}
            ref={nameRef}
            type="text"
            id={`${formId}-name`}
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${formId}-desc`}>Описание задачи</label>
          <input
            required
            defaultValue={event?.desc}
            ref={descRef}
            type="text"
            id={`${formId}-desc`}
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${formId}-task-type`}>Тип задачи</label>
          <select
            id={`${formId}-task-type`}
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="styled-select"
          >
            <option value="Написать письмо коллеге">
              Написать письмо коллеге
            </option>
            <option value="Обновить базу данных">Обновить базу данных</option>
          </select>
        </div>
        <div className="row">
          <div className="form-group">
            <label htmlFor={`${formId}-start-time`}>Начало</label>
            <input
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              type="time"
              id={`${formId}-start-time`}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Цвет</label>
          <div className="row left">
            {EVENT_COLORS.map((color) => (
              <Fragment key={color}>
                <input
                  type="radio"
                  name="color"
                  value={color}
                  id={`${formId}-${color}`}
                  checked={selectedColor === color}
                  onChange={() => setSelectedColor(color)}
                  className="color-radio"
                />
                <label htmlFor={`${formId}-${color}`}>
                  <span className="sr-only">{color}</span>
                </label>
              </Fragment>
            ))}
          </div>
        </div>
        <div className="row">
          <button className="btn btn-success" type="submit">
            {isNew ? "Добавить" : "Редактировать"}
          </button>
          {onDelete != null && (
            <button onClick={onDelete} className="btn btn-delete" type="button">
              Удалить
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
