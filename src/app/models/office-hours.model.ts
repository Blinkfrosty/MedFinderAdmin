import { DaySchedule } from './day-schedule.model';

/**
 * Doctor Office Hours model
 */
export interface OfficeHours {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}