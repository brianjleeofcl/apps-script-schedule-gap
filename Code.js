function runCode() {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (let sheet of sheets) {
    updateSheet(sheet)
  }
}

function updateSheet(sheet) {
  const name = sheet.getName()
  sheet.clear()
  let input;
  try {
    input = parseSheetName(name)
  } catch(er) {
    writeMessageOnA1(sheet, er.message)
    return
  }

  const dayProcessor = getDayProcessor(input)
 
  const days = formDateArray(input.start, input.end)
  const availabilities = [];
  for (let day of days) {
    const availability = dayProcessor(day)
    if (!availability) continue
    availabilities.push([dateFormat.format(day), availability])
  }

  if (!availabilities.length) {
    writeMessageOnA1(sheet, 'No Availabilities Found')
  }

  const selection = sheet.setActiveSelection(`A1:B${availabilities.length}`)
  selection.setValues(availabilities)
}

function getDayProcessor(input) {
  const cal = CalendarApp.getCalendarById(input.id)
  return function(day) {
    const allEvents = cal.getEventsForDay(day)

    const travel = allEvents.filter(event => event.isAllDayEvent() 
      && event.getDescription().match(new RegExp('travel')))

    if (travel.length > 0) {
      return
    }

    const boundedEvents = allEvents.filter(event => !event.isAllDayEvent() 
      && !isTimeBeforeWork(event.getEndTime())
      && !isTimeAfterWork(event.getStartTime()));

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

    notAvailable.sort((a, b) => {
      return a.start.valueOf() === b.start.valueOf() 
        ? a.end.valueOf() - b.end.valueOf() 
        : a.start.valueOf() - b.start.valueOf()
      })

    let pointerInterval = null;
    let merged = [];
    for (let event of notAvailable) {
      if (!pointerInterval) {
        pointerInterval = event;
        continue;
      }         
      
      if (!pointerInterval.isTimeInInterval(event.start)) {
        merged.push(pointerInterval);
        pointerInterval = event
      } else {
        if (!pointerInterval.isTimeInInterval(event.end)) {
          pointerInterval.end = event.end
        }
      }
    }
    merged.push(pointerInterval)

    const gaps = [...new Array(merged.length - 1)].map((_, i) => {
      return new TimeInterval(merged[i].end, merged[i + 1].start)
    })

    const firstStart = notAvailable[0].start
    if (!isTimeBeforeWork(firstStart)) {
      gaps.unshift(new TimeInterval(getWorkStart(day), firstStart))
    }
    const lastEnd = notAvailable[notAvailable.length - 1].end
    if (!isTimeAfterWork(lastEnd)) {
      gaps.push(new TimeInterval(lastEnd, getWorkEnd(day)))     
    }

    const canMeet = gaps.filter(interval => interval.getMinutes() >= input.interval)

    return canMeet.map(interval => interval.printTimeRange()).join('; ')
  }
}


function formDateArray(start, end) {
  const endMonth = end.getMonth()
  const endDate = end.getDate()
  const row = []
  let pointer = new Date(start)
  while (pointer.getMonth() !== endMonth || pointer.getDate() !== endDate) {
    const day = pointer.getDay()
    if (day !== 0 && day !== 6) {
      row.push(new Date(pointer))
    }
    pointer.setDate(pointer.getDate() + 1)
  }
  return row
}

function writeMessageOnA1(sheet, message) {
  sheet.getRange('A1').setValue(message)
}

function parseSheetName(name) {
  const parts = name.split(',').map(part => part.trim());
  if (parts.length !== 4) {
    throw new Error("Not enough information; please enter start, range (weeks), interval (min)")
  }

  const weeks = +parts[2]
  if (isNaN(weeks)) {
    throw new Error("Invalid range input, please use number of weeks")
  }

  const interval = +parts[3]
  if (isNaN(interval)) {
    throw new Error("Invalid interval, please use number of minutes")
  }

  const start = parseDate(parts[1]);
  const end = new Date(start)
  end.setDate(end.getDate() + weeks * 7)
  
  return { start, end, interval, id: parts[0] }
}

function parseDate(date) {
  let [month, day, year] = date.split('/')
  if (!year) {
    year = new Date().getFullYear()
  }
  const generatedDate = new Date()
  generatedDate.setDate(day)
  generatedDate.setMonth(month - 1)
  generatedDate.setFullYear(year)
  setTime(generatedDate)
  return generatedDate
}

