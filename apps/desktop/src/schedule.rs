use chrono::{DateTime, Datelike, Timelike, Utc};
use serde::Deserialize;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkSchedule {
    pub enabled: bool,
    pub timezone: String,
    pub days: Vec<u32>,
    pub start_minute: u32,
    pub end_minute: u32,
}

impl WorkSchedule {
    pub fn allows(&self, now: DateTime<Utc>) -> bool {
        if !self.enabled {
            return true;
        }
        let Ok(zone) = self.timezone.parse::<chrono_tz::Tz>() else {
            return false;
        };
        let local = now.with_timezone(&zone);
        let day = local.weekday().num_days_from_sunday();
        let minute = local.hour() * 60 + local.minute();
        if self.start_minute < self.end_minute {
            self.days.contains(&day) && minute >= self.start_minute && minute < self.end_minute
        } else {
            (self.days.contains(&day) && minute >= self.start_minute)
                || (self.days.contains(&((day + 6) % 7)) && minute < self.end_minute)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn enforces_overnight_and_timezone_boundaries() {
        let schedule = WorkSchedule {
            enabled: true,
            timezone: "Africa/Kigali".into(),
            days: vec![5],
            start_minute: 1320,
            end_minute: 360,
        };
        assert!(schedule.allows("2026-09-12T01:00:00Z".parse().unwrap()));
        assert!(!schedule.allows("2026-09-12T04:00:00Z".parse().unwrap()));
    }
}
