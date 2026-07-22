using System;
using System.ComponentModel.DataAnnotations;

namespace BookingPlatform.Api.Dtos
{
    public class UpsertServiceRequest
    {
        [Required]
        public string Name { get; set; }

        public string Description { get; set; }

        [Range(30, 480)]
        public int DurationMinutes { get; set; }

        [Range(0, 9999)]
        public decimal Price { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class UpsertBusinessHourRequest
    {
        [Range(0, 6)]
        public int DayOfWeek { get; set; }

        [Required]
        public TimeSpan From { get; set; }

        [Required]
        public TimeSpan To { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class RescheduleAppointmentRequest
    {
        [Required]
        public DateTime NewStartTimeUtc { get; set; }
    }

    public class UpsertExceptionPeriodRequest
    {
        public Guid? EmployeeId { get; set; }

        [Required]
        public DateTime Date { get; set; }

        public TimeSpan? From { get; set; }
        public TimeSpan? To { get; set; }

        [Required]
        public string Type { get; set; }

        public string Description { get; set; }
    }

    public class AssignEmployeeRequest
    {
        public Guid? EmployeeId { get; set; }
    }
}
