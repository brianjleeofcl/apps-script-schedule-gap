class TimeInterval {
  static fromEvent(event) {
    return new TimeInterval(event.getStartTime(), event.getEndTime())
  }

  constructor(start, end) {
    if (!(start instanceof Date) || !(end instanceof Date)) {
      throw new Error("Input Error: start and end time must be an instance of Date")
    }
    if (start.valueOf() > end.valueOf()) {
      throw new Error("Input Error: end time cannot be before start")
    }
    this.start = start;
    this.end = end;

    if (!start) {
      debugger
    }

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

  printTimeRange(format) {
    return format.formatRange(this.start, this.end)
  }
}

const TRBaseFormat = {
    hour: 'numeric',
    minute: 'numeric',
}

const timeRangeFormat = {
  pt: Intl.DateTimeFormat('en', {...TRBaseFormat, timeZone: 'US/Pacific'}),
  mt: Intl.DateTimeFormat('en', {...TRBaseFormat, timeZone: 'US/Mountain'}),
  ct: Intl.DateTimeFormat('en', {...TRBaseFormat, timeZone: 'US/Central'}),
  et: Intl.DateTimeFormat('en', {...TRBaseFormat, timeZone: 'US/Eastern'}),
}

const dateRangeFormat = Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
})

function getDate(date) {

}

function setTime(date, hour, min) {
  date.setHours(hour || 0, min ||0, 0)
}

