const WEEK = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}

class Workday {
  constructor(date) {
    const day = date.getDay();

    switch (day) {
      case WEEK.fri:
        this.start = 8
        this.end = 15
        break
      default:
        this.start = 8
        this.end = 17
    }
  }
}

function isTimeBeforeWork(time) {
  const day = new Workday(time.getDay())
  return time.getHours() < day.start || time.getHours() === day.start && time.getMinutes() === 0
}

function isTimeAfterWork(time) {
  const day = new Workday(time.getDay())
  return time.getHours() > day.end || time.getHours() === day.end && time.getMinutes() === 0
}

function getWorkStart(date) {
  const newDate = new Date(date.valueOf())
  const day = new Workday(date.getDay())
  setTime(newDate, day.start)
  return newDate
}

function getWorkEnd(date) {
  const newDate = new Date(date.valueOf())
  const day = new Workday(date.getDay())
  setTime(newDate, day.end)
  return newDate
}

class TimeInterval {
  static fromEvent(event) {
    return new TimeInterval(event.getStartTime(), event.getEndTime())
  }

  constructor(start, end) {
    if (start.valueOf() > end.valueOf()) {
      throw new Error("Input Error: end time cannot be before start")
    }
    this.start = start;
    this.end = end;

    this.intraDay = start.getFullYear() === end.getFullYear()
      && start.getMonth() === end.getMonth()
      && start.getDate() === end.getDate()
  }

  getMinutes() {
    const ms = this.end.valueOf() - this.start.valueOf()
    return ms / 60000
  }

  isTimeInInterval(time) {
    const unix = time.valueOf()
    return this.start.valueOf() <= unix && this.end.valueOf() >= unix
  }

  isOutsideWorkday() {
    return this.end.getHours() < this.start || this.start.getHours() >= this.end
  }

  printTimeRange() {
    return timeRangeFormat.formatRange(this.start, this.end)
  }
}

const timeRangeFormat = Intl.DateTimeFormat('en', {
  hour: 'numeric',
  minute: 'numeric',
})

const dateFormat = Intl.DateTimeFormat('en', {
  weekday: 'short',
  month: 'numeric',
  day: 'numeric',
})

function setTime(date, hour, min, sec) {
  date.setHours(hour || 0)
  date.setMinutes(min || 0)
  date.setSeconds(sec || 0)
}

