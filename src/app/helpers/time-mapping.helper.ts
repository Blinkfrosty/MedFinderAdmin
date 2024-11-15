export class TimeMapping {
    private static readonly timeMap: { [key: string]: string } = {
        '12:00 AM': '00:00',
        '12:30 AM': '00:30',
        '01:00 AM': '01:00',
        '01:30 AM': '01:30',
        '02:00 AM': '02:00',
        '02:30 AM': '02:30',
        '03:00 AM': '03:00',
        '03:30 AM': '03:30',
        '04:00 AM': '04:00',
        '04:30 AM': '04:30',
        '05:00 AM': '05:00',
        '05:30 AM': '05:30',
        '06:00 AM': '06:00',
        '06:30 AM': '06:30',
        '07:00 AM': '07:00',
        '07:30 AM': '07:30',
        '08:00 AM': '08:00',
        '08:30 AM': '08:30',
        '09:00 AM': '09:00',
        '09:30 AM': '09:30',
        '10:00 AM': '10:00',
        '10:30 AM': '10:30',
        '11:00 AM': '11:00',
        '11:30 AM': '11:30',
        '12:00 PM': '12:00',
        '12:30 PM': '12:30',
        '01:00 PM': '13:00',
        '01:30 PM': '13:30',
        '02:00 PM': '14:00',
        '02:30 PM': '14:30',
        '03:00 PM': '15:00',
        '03:30 PM': '15:30',
        '04:00 PM': '16:00',
        '04:30 PM': '16:30',
        '05:00 PM': '17:00',
        '05:30 PM': '17:30',
        '06:00 PM': '18:00',
        '06:30 PM': '18:30',
        '07:00 PM': '19:00',
        '07:30 PM': '19:30',
        '08:00 PM': '20:00',
        '08:30 PM': '20:30',
        '09:00 PM': '21:00',
        '09:30 PM': '21:30',
        '10:00 PM': '22:00',
        '10:30 PM': '22:30',
        '11:00 PM': '23:00',
        '11:30 PM': '23:30'
    };

    /**
     * Gets the 24-hour time for a given 12-hour time.
     * @param time12h The 12-hour time string (e.g., "02:30 PM").
     * @returns The corresponding 24-hour time string (e.g., "14:30").
     */
    static get24HourTime(time12h: string): string | undefined {
        return this.timeMap[time12h];
    }

    /**
     * Gets the 12-hour time for a given 24-hour time.
     * @param time24h The 24-hour time string (e.g., "14:30").
     * @returns The corresponding 12-hour time string (e.g., "02:30 PM").
     */
    static get12HourTime(time24h: string): string | undefined {
        const entry = Object.entries(this.timeMap).find(([key, value]) => value === time24h);
        return entry ? entry[0] : undefined;
    }

    /**
     * Gets all 12-hour time strings.
     * @returns An array of all 12-hour time strings.
     */
    static getAll12HourTimes(): string[] {
        return Object.keys(this.timeMap);
    }

    /**
     * Gets all 24-hour time strings.
     * @returns An array of all 24-hour time strings.
     */
    static getAll24HourTimes(): string[] {
        return Object.values(this.timeMap);
    }
}