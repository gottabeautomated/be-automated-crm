import { RRule, RRuleSet, rrulestr, Weekday } from 'rrule';
import { EventFormData } from '@/types/calendarTypes';
import { Timestamp } from 'firebase/firestore';
import { FirestoreEvent, CalendarDisplayEvent, EVENT_TYPE_DETAILS, EventTypeName } from '@/types/calendarTypes';

const dayStringToRruleWeekday = (day: string): Weekday | undefined => {
  const mapping: { [key: string]: Weekday } = {
    'MO': RRule.MO,
    'TU': RRule.TU,
    'WE': RRule.WE,
    'TH': RRule.TH,
    'FR': RRule.FR,
    'SA': RRule.SA,
    'SU': RRule.SU,
  };
  return mapping[day];
};

interface GeneratedRRuleResult {
  rruleString: string | null;
  recurrenceEndDate: Timestamp | null;
}

export const generateRRuleFromFormData = (formData: EventFormData): GeneratedRRuleResult => {
  if (!formData.isRecurring || formData.recurrenceFrequency === 'none') {
    return { rruleString: null, recurrenceEndDate: null };
  }

  let freq: RRule.Frequency;
  switch (formData.recurrenceFrequency) {
    case 'daily':
      freq = RRule.DAILY;
      break;
    case 'weekly':
      freq = RRule.WEEKLY;
      break;
    case 'monthly':
      freq = RRule.MONTHLY;
      break;
    case 'yearly':
      freq = RRule.YEARLY;
      break;
    default:
      return { rruleString: null, recurrenceEndDate: null };
  }

  const dtstart = new Date(formData.startDate);
  const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
  if (!isNaN(startHours) && !isNaN(startMinutes)) {
    dtstart.setHours(startHours, startMinutes, 0, 0);
  }

  const rruleOptions: Partial<RRule.Options> = {
    freq,
    dtstart: dtstart,
    interval: formData.recurrenceInterval || 1,
  };

  if (formData.recurrenceFrequency === 'weekly' && formData.recurrenceByDay && formData.recurrenceByDay.length > 0) {
    rruleOptions.byweekday = formData.recurrenceByDay.map(dayStringToRruleWeekday).filter(d => d !== undefined) as Weekday[];
  }

  let recurrenceEndDateTimestamp: Timestamp | null = null;

  if (formData.recurrenceEndType === 'onDate' && formData.recurrenceEndDateForm) {
    const untilDate = new Date(formData.recurrenceEndDateForm);
    untilDate.setHours(23, 59, 59, 999);
    rruleOptions.until = untilDate;
    recurrenceEndDateTimestamp = Timestamp.fromDate(untilDate);
  } else if (formData.recurrenceEndType === 'afterOccurrences' && formData.recurrenceOccurrences) {
    rruleOptions.count = formData.recurrenceOccurrences;
  }

  try {
    const rule = new RRule(rruleOptions as RRule.Options);
    return { rruleString: rule.toString(), recurrenceEndDate: recurrenceEndDateTimestamp };
  } catch (e) {
    console.error("Error generating RRULE string:", e);
    return { rruleString: null, recurrenceEndDate: null };
  }
};

// Weitere Funktionen zum Parsen von RRULEs und Berechnen von Vorkommen folgen hier später.

/**
 * Erzeugt die Vorkommen eines Serientermins für einen gegebenen Zeitraum.
 * @param masterEvent Das Master-FirestoreEvent, das die Serienregeln enthält.
 * @param viewStart Startdatum des Zeitraums, für den Vorkommen generiert werden sollen.
 * @param viewEnd Enddatum des Zeitraums, für den Vorkommen generiert werden sollen.
 * @returns Ein Array von CalendarDisplayEvent-Instanzen.
 */
export const getOccurrences = (
  masterEvent: FirestoreEvent,
  viewStart: Date,
  viewEnd: Date
): CalendarDisplayEvent[] => {
  if (!masterEvent.isRecurring || !masterEvent.rruleString || !masterEvent.id) {
    return [];
  }

  try {
    const rule = rrulestr(masterEvent.rruleString, { forceset: true }) as RRuleSet | RRule;
    
    const originalEventStart = masterEvent.start.toDate();
    const originalEventEnd = masterEvent.end.toDate();
    const duration = originalEventEnd.getTime() - originalEventStart.getTime();

    let seriesActualEnd = viewEnd;
    if (masterEvent.recurrenceEndDate) {
      const masterRecurrenceEndDate = masterEvent.recurrenceEndDate.toDate();
      if (masterRecurrenceEndDate < seriesActualEnd) {
        seriesActualEnd = masterRecurrenceEndDate;
      }
    }
    
    let rruleSetToUse: RRuleSet;
    if (rule instanceof RRule) {
        rruleSetToUse = new RRuleSet();
        rruleSetToUse.rrule(rule);
    } else {
        rruleSetToUse = rule;
    }

    if (masterEvent.excludedDates && masterEvent.excludedDates.length > 0) {
      masterEvent.excludedDates.forEach(excludedTimestamp => {
        const excludedDate = excludedTimestamp.toDate();
        const exDateWithOriginalTime = new Date(excludedDate);
        exDateWithOriginalTime.setHours(originalEventStart.getHours(), originalEventStart.getMinutes(), originalEventStart.getSeconds(), originalEventStart.getMilliseconds());
        rruleSetToUse.exdate(exDateWithOriginalTime);
      });
    }

    const occurrencesDates = rruleSetToUse.between(viewStart, seriesActualEnd, true);

    return occurrencesDates.map(occurrenceDate => {
      const occurrenceStart = new Date(occurrenceDate);
      occurrenceStart.setHours(originalEventStart.getHours(), originalEventStart.getMinutes(), originalEventStart.getSeconds(), originalEventStart.getMilliseconds());
      
      const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);
      const eventTypeDetail = EVENT_TYPE_DETAILS[masterEvent.type as EventTypeName];

      return {
        id: `${masterEvent.id}_${occurrenceDate.toISOString()}`,
        title: masterEvent.title,
        start: occurrenceStart,
        end: occurrenceEnd,
        allDay: masterEvent.allDay,
        resource: {
          type: masterEvent.type,
          color: eventTypeDetail?.color || '#3174ad',
          contactId: masterEvent.contactId,
          dealId: masterEvent.dealId,
          location: masterEvent.location,
          attendees: masterEvent.attendees,
          notes: masterEvent.notes,
          reminderOffsetMinutes: masterEvent.reminderOffsetMinutes,
          firestoreEvent: masterEvent,
          isOccurrence: true,
          occurrenceDate: occurrenceStart,
          masterEventId: masterEvent.id,
        },
      };
    });

  } catch (e) {
    console.error("Error getting occurrences for event:", masterEvent.id, e);
    return [];
  }
}; 