const WEEK = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}

const DATE_FORMAT = Intl.DateTimeFormat('en', {
  weekday: 'short',
  month: 'numeric',
  day: 'numeric',
  year: '2-digit', // sheet will assume same year if not specified
  timeZone: 'US/Pacific',
})

class Workday {
  get dateFormat() {
    return DATE_FORMAT
  }

  constructor(date) {
    if (!date) throw new Error('Workday class needs input')
    this.date = date;

    switch (date.getDay()) {
      case WEEK.fri:
        this.start = 8
        this.end = 15
        break
      default:
        this.start = 8
        this.end = 17
    }
  }

  isTimeBeforeWork(time) {
    return time.getHours() < this.start || time.getHours() === this.start && time.getMinutes() === 0
  }

  isTimeAfterWork(time) {
    return !(time.getHours() < this.end)
  }
  
  getWorkStart() {
    const newDate = new Date(this.date.valueOf())
    setTime(newDate, this.start)
    return newDate
  }

  getWorkEnd() {
    const newDate = new Date(this.date.valueOf())
    setTime(newDate, this.end)
    return newDate
  }

  printToday() {
    return this.dateFormat.format(this.date)
  }
}

class DailySchedule extends Workday {
  static fromCalendar(cal) {
    return function(day) {
      return new Promise(res => res(new DailySchedule(day, cal.getEventsForDay(day))))
    }
  }
  
  constructor(day, events) {
    super(day)
    this.busy = [];
    if (!events) {
      throw new Error('error fetching events for ', day)
    }

    if (events.some(event => {
      // if (event.isAllDayEvent()) console.log(event.getTitle(), event.getDescription())
      return event.isAllDayEvent()
        && (event.getTitle().match(new RegExp('OOO')) || event.getDescription().match(new RegExp('travel')))
    })) {
      this.skip = true;
      return this
    }
    this.skip = false;

    const boundedEvents = events.filter(event => {
      return !event.isAllDayEvent() 
        && !this.isTimeBeforeWork(event.getEndTime())
        && !this.isTimeAfterWork(event.getStartTime())
    });

    const notAvailable = [];
    const notConsidered = [];
    for (let event of boundedEvents) {
      const title = event.getTitle()
      if (checkAvailableCodeword(title)) {
        notConsidered.push(title)
      } else {
        notAvailable.push(TimeInterval.fromEvent(event))
      }
    }

    if (!notAvailable.length) return this._setGaps(notAvailable)

    notAvailable.sort((a, b) => {
      return a.start.valueOf() === b.start.valueOf() 
        ? a.end.valueOf() - b.end.valueOf() 
        : a.start.valueOf() - b.start.valueOf()
    })

    let pointerInterval = null;
 
    for (let event of notAvailable) {
      if (!pointerInterval) {
        pointerInterval = event;
        continue;
      }         
        
      if (!pointerInterval.isTimeInInterval(event.start)) {
        this.busy.push(pointerInterval);
        pointerInterval = event
      } else {
        if (!pointerInterval.isTimeInInterval(event.end)) {
          pointerInterval.end = event.end
        }
      }
    }
    this.busy.push(pointerInterval)
    this._setGaps(this.busy)
  }

  _setGaps(busy) {
    if (!busy.length) {
      const start = new Date()
      const end = new Date()
      setTime(start, this.start)
      setTime(end, this.end)
      this.gaps = [new TimeInterval(start, end)]
      return this
    }

    this.gaps = [...new Array(busy.length - 1)].map((_, i) => {
      return new TimeInterval(busy[i].end, busy[i + 1].start)
    })

    const firstStart = busy[0].start
    if (!this.isTimeBeforeWork(firstStart)) {
      this.gaps.unshift(new TimeInterval(this.getWorkStart(), firstStart))
    }
    const lastEnd = busy[busy.length - 1].end
    if (!this.isTimeAfterWork(lastEnd)) {
      this.gaps.push(new TimeInterval(lastEnd, this.getWorkEnd()))     
    }

    if (!this.gaps.length) this.skip = true
    return this
  }

  filterByLength(minutes) {
    if (this.skip) return this
    this.gaps = this.gaps.filter(gap => gap.getMinutes() >= minutes)
    if (!this.gaps.length) this.skip = true
    return this
  }

  printAvailabilityInTZ(timezoneFormat) {
    if (!this.gaps.length) return ''
    return this.gaps.map(gap => gap.printTimeRange(timezoneFormat)).join('; ')
  }

  printAvailabilityInAllTZ() {
    return [
      this.printToday(), 
      this.printAvailabilityInTZ(timeRangeFormat.pt), 
      this.printAvailabilityInTZ(timeRangeFormat.et), 
      this.printAvailabilityInTZ(timeRangeFormat.ct),
    ]
  }
}
