function runCode() {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();

  Promise.all(sheets.map(sheet => updateSheet(sheet)));  
}

function prepareBlankSheet(sheet) {
  sheet.clear()
  sheet.setColumnWidth(2, 360)
  sheet.setColumnWidth(3, 360)
  sheet.setColumnWidth(4, 360)
  writeMessageOnA1(sheet, 'Starting script execution')
}

function updateSheet(sheet) {
  return new Promise(res => res(prepareBlankSheet(sheet)))
    .then(() => parseSheetName(sheet.getName()))
    .then(input => {
        range = dateRangeFormat.formatRange(input.start, input.end)
        writeMessageOnA1(sheet, `Looking up schedule for ${range}`)
        const getDailySchedule = DailySchedule.fromCalendar(CalendarApp.getCalendarById(input.id))
        const days = formDateArray(input.start, input.end)

        return Promise.all(days.map(date => getDailySchedule(date).then(schedule => schedule.filterByLength(input.interval))))
    })
    .then(schedules => schedules.filter(schedule => !schedule.skip))
    .then(available => {
      if (!available.length) throw new Error('No Availabilities Found')

      sheet.setActiveSelection(`A1:D1`).setValues([[range, 'Pacific', 'Eastern', 'Central']])
      sheet.setActiveSelection(`A2:D${available.length + 1}`)
        .setValues(available.map(schedule => schedule.printAvailabilityInAllTZ()))
    })
    .catch(err => {
      console.error(err)
      writeMessageOnA1(sheet, err.message)
    })
}

function formDateArray(start, end) {
  const holidays = getHolidays(start, end)
  const endMonth = end.getMonth()
  const endDate = end.getDate()
  const row = []
  let pointer = new Date(start)
  while (pointer.getMonth() !== endMonth || pointer.getDate() !== endDate) {
    const day = pointer.getDay()
    if (day !== 0 && day !== 6 ) {
      row.push(new Date(pointer))
    }
    pointer.setDate(pointer.getDate() + 1)
  }
  return row
}

function getHolidays(start, end) {
  const holidayCalendar = CalendarApp.getCalendarsByName('UW Seattle Academic Calendar|Holidays')[0]
  const holidays = holidayCalendar.getEvents(start, end).map(event => event.getStartTime())
  // console.log(holidays)
  return []
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
