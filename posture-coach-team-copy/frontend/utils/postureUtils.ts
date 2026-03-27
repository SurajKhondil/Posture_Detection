
export interface PostureStats {
    avgScore: number;
    goodTimeH: number;
    goodTimeM: number;
    sessionCount: number;
}

/**
 * Calculates weekly posture statistics from a list of sessions.
 * Filters sessions starting from the most recent Monday.
 */
export const calculateWeeklyStats = (sessions: any[]): PostureStats => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sun, 1 is Mon
    const diff = now.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    let totalScore = 0;
    let count = 0;
    let totalMinutes = 0;

    sessions.forEach((s) => {
        const sDate = new Date(s.start_time);
        if (sDate >= monday && s.posture_score !== null) {
            totalScore += s.posture_score;
            count++;
            totalMinutes += (s.good_time_minutes || 0);
        }
    });

    return {
        avgScore: count > 0 ? Math.round(totalScore / count) : 0,
        goodTimeH: Math.floor(totalMinutes / 60),
        goodTimeM: Math.round(totalMinutes % 60),
        sessionCount: count
    };
};

/**
 * Returns current week identifier in format "YYYY-WW"
 */
export const getCurrentISOWeek = () => {
    const now = new Date();
    const date = new Date(now.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${date.getFullYear()}-${weekNumber}`;
};
