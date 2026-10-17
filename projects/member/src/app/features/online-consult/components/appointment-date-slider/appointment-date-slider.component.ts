import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChildren, QueryList, Input, Output, EventEmitter } from '@angular/core';
import moment from 'moment';
import { OpdConsultationService } from '../../../../services/opd-consultation.service';

export interface WeekDateItem {
  alias: string;
  day: string;
  fullDate: number;
  slotCount: number | null;
  status: 'loading' | 'available' | 'not_available';
}

@Component({
  selector: 'app-appointment-date-slider',
  standalone: true,
  imports: [],
  templateUrl: './appointment-date-slider.component.html',
  styleUrls: ['./appointment-date-slider.component.scss']
})
export class AppointmentDateSliderComponent implements OnInit {
  @ViewChildren('dateCard') dateCards!: QueryList<ElementRef>;

  weekDates: WeekDateItem[] = [];
  selectedWeekDate: WeekDateItem | null = null;
  pickerValue: number = moment().startOf('day').valueOf();
  hasActiveDate: number = this.pickerValue;
  slotMinDate: any = moment().startOf('day');

  @Input() availableDays: number = 7;
  @Input() showPickerButton: boolean = true;
  @Input() practitionerId: string = '';
  @Input() uhId: string = '';
  @Input() facilityId: string = '';
  @Input() departmentId: string = '';
  @Output() onSlotCountChange = new EventEmitter<{date: number, count: number}>();
  @Output() dateSelected = new EventEmitter<number>();

  constructor(private cdr: ChangeDetectorRef, private consultationService: OpdConsultationService) {}

  ngOnInit(): void {
    this.initializeWeekDates();
    this.hasActiveDate = this.pickerValue;
  }

  initializeWeekDates(): void {
    this.weekDates = [];
    const startDate = moment().startOf('day');

    for (let i = 0; i < this.availableDays; i++) {
      const date = moment(startDate).add(i, 'day');
      const dateObj: WeekDateItem = {
        alias: i === 0 ? 'Today' : i === 1 ? 'Tom' : date.format('ddd'),
        day: date.format('DD MMM'),
        fullDate: date.valueOf(),
        slotCount: null,
        status: 'loading'
      };
      this.weekDates.push(dateObj);

      // Fetch slot count for each date
      this.fetchSlotCount(dateObj);
    }
  }

  fetchSlotCount(dateItem: WeekDateItem): void {
    const fetchStart = moment(dateItem.fullDate).startOf('day');
    const fetchEnd = moment(fetchStart).add(1, 'day');

    const slotDate = dateItem.fullDate;
    const slotDays = moment(dateItem.fullDate).format('dd').toUpperCase();

    this.consultationService.getSlots(
      this.practitionerId,
      slotDate,
      slotDays,
      this.facilityId,
      this.departmentId,
      this.uhId
    )
      .subscribe({
        next: (slots) => {
          dateItem.slotCount = slots.length;
          dateItem.status = slots.length > 0 ? 'available' : 'not_available';

          if (dateItem.fullDate === this.pickerValue) {
            this.selectedWeekDate = dateItem;
          }

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching slot count:', error);
          dateItem.slotCount = 0;
          dateItem.status = 'not_available';
          this.cdr.detectChanges();
        }
      });
  }

selectDate(date: WeekDateItem): void {
    if (this.selectedWeekDate?.fullDate !== date.fullDate) {
      this.selectedWeekDate = date;
      this.pickerValue = date.fullDate;
      this.hasActiveDate = date.fullDate;
      this.dateSelected.emit(date.fullDate);
      this.cdr.detectChanges();
    }
  }
  
  openCalendarPicker(): void {
    this.showCalendarModal = true;
  }
  
  selectCalendarDate(date: number): void {
    const dateItem = this.weekDates.find(d => d.fullDate === date);
    if (dateItem) {
      this.selectDate(dateItem);
    } else {
      const newDateItem: WeekDateItem = {
        alias: moment(date).format('ddd'),
        day: moment(date).format('DD MMM'),
        fullDate: date,
        slotCount: null,
        status: 'loading'
      };
      this.fetchSlotCount(newDateItem);
      this.selectDate(newDateItem);
    }
    this.showCalendarModal = false;
  }
  
  showCalendarModal: boolean = false;
  currentMonth: number = moment().startOf('month').valueOf();

  formatDate(date: number): string {
    return moment(date).format('DD MMM');
  }

  formatMonth(timestamp: number): string {
    return moment(timestamp).format('MMMM YYYY');
  }

  isToday(date: number): boolean {
    return moment(date).isSame(moment().startOf('day'), 'day');
  }

  get calendarDays(): any[] {
    const monthStart = moment(this.currentMonth).startOf('month');
    const startDay = monthStart.clone().subtract(monthStart.day(), 'days');
    const days: any[] = [];

    for (let i = 0; i < 42; i++) {
      const day = startDay.add(1, 'day');
      const date = day.valueOf();
      const isCurrentMonth = day.month() === monthStart.month();
      const isToday = this.isToday(date);

      days.push({
        date: isCurrentMonth ? date : null,
        isCurrentMonth,
        isToday
      });
    }

    return days;
  }

  changeMonth(direction: number): void {
    this.currentMonth = moment(this.currentMonth).add(direction, 'month').startOf('month').valueOf();
  }

  getSlotCountStatus(slotCount: number | null): string {
    if (slotCount === null) return 'Loading...';
    if (slotCount > 0) return `${slotCount} Available`;
    return 'No slots';
  }

  formatDayNumber(date: number): string {
    return moment(date).format('D');
  }
}