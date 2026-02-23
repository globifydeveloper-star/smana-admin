"use client"

import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

// Calendar is a direct alias of the DayPicker component from react-day-picker.
// All DayPicker props are supported — no hardcoded styles or wrappers.
export type CalendarProps = React.ComponentProps<typeof DayPicker>

const Calendar = DayPicker as React.FC<CalendarProps>

Calendar.displayName = "Calendar"

export { Calendar }
