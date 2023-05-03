const WORKDAY = {
  start: 8,
  end: 17,
}

function isTimeBeforeWork(time) {
  return time.getHours() < WORKDAY.start || time.getHours() === WORKDAY.start && time.getMinutes() === 0
}

function isTimeAfterWork(time) {
  return time.getHours() > WORKDAY.end || time.getHours() === WORKDAY.end && time.getMinutes() === 0
}

function getWorkStart(date) {
  const newDate = new Date(date.valueOf())
  setTime(newDate, WORKDAY.start)
  return newDate
}

function getWorkEnd(date) {
  const newDate = new Date(date.valueOf())
  setTime(newDate, WORKDAY.end)
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

