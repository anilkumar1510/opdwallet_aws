import { Component, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef, ViewChildren, QueryList, Input, Output, EventEmitter } from '@angular/core';
import moment from 'moment';
import { OpdConsultationService } from '../../../../services/opd-consultation.service';

export interface WeekDateItem {
  alias: string;
  day: string;
  fullDate: number;
  slotCount: number | null;
  status: 'loading' | 'available' | 'not_available';
  isPast?: boolean;
}

@Component({
  selector: 'app-appointment-date-slider',
  standalone: true,
  imports: [],
  templateUrl: './appointment-date-slider.component.html',
  styleUrls: ['./appointment-date-slider.component.scss']
})
export class AppointmentDateSliderComponent implements OnInit, OnChanges {
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

  showCalendarModal: boolean = false;
  currentMonth: number = moment().startOf('month').valueOf();

  constructor(private cdr: ChangeDetectorRef, private consultationService: OpdConsultationService) {}

  ngOnInit(): void {
    this.initializeWeekDates();
    this.hasActiveDate = this.pickerValue;
    this.selectedWeekDate = this.weekDates[0] || null;
    this.dateSelected.emit(this.pickerValue);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['practitionerId'] && !changes['practitionerId'].firstChange) {
      this.initializeWeekDates();
      this.selectedWeekDate = this.weekDates[0] || null;
      this.pickerValue = this.weekDates[0]?.fullDate || moment().startOf('day').valueOf();
      this.hasActiveDate = this.pickerValue;
      this.dateSelected.emit(this.pickerValue);
    }
  }

  initializeWeekDates(): void {
    this.weekDates = [];
    const startDate = moment().startOf('day');
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');
    
    for (let i = 0; i < this.availableDays; i++) {
      const date = moment(startDate).add(i, 'day');
      const isPast = date.isBefore(today, 'day');
      const alias = date.isSame(today, 'day') ? 'Today' : date.isSame(tomorrow, 'day') ? 'Tom' : date.format('ddd');
      const dateObj: WeekDateItem = {
        alias,
        day: date.format('DD MMM'),
        fullDate: date.valueOf(),
        slotCount: null,
        status: isPast ? 'not_available' : 'loading',
        isPast
      };
      this.weekDates.push(dateObj);
      
      if (!isPast) {
        this.fetchSlotCount(dateObj);
      }
    }
  }

  fetchSlotCount(dateItem: WeekDateItem): void {
    const slotDate = dateItem.fullDate;
    const slotDays = moment(dateItem.fullDate).format('dd').toUpperCase();

    if (!this.practitionerId) {
      dateItem.slotCount = 0;
      dateItem.status = 'not_available';
      this.cdr.detectChanges();
      return;
    }

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
          const now = Date.now();
          const validCount = (slots || []).filter(s => {
            const status = (s.status || '').toLowerCase().trim();
            const startOk = s.slot_start_time ? s.slot_start_time > now : true;
            const endOk = s.slot_end_time ? s.slot_end_time > now : true;
            return status === 'available' && startOk && endOk;
          }).length;

          dateItem.slotCount = validCount;
          dateItem.status = validCount > 0 ? 'available' : 'not_available';

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
    if (date.isPast) return;
    this.selectedWeekDate = date;
    this.pickerValue = date.fullDate;
    this.hasActiveDate = date.fullDate;
    this.dateSelected.emit(date.fullDate);
    this.cdr.detectChanges();
  }
  
  openCalendarPicker(): void {
    this.currentMonth = moment(this.pickerValue || undefined).startOf('month').valueOf();
    this.showCalendarModal = true;
  }
  
  selectCalendarDate(date: number): void {
    const dateItem = this.weekDates.find(d => d.fullDate === date);
    if (dateItem) {
      this.selectDate(dateItem);
    } else {
      this.generateWeekDatesAroundDate(date);
    }
    this.showCalendarModal = false;
    this.cdr.detectChanges();
  }

  private generateWeekDatesAroundDate(selectedDate: number): void {
    const startDate = moment(selectedDate).startOf('day');
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');
    this.weekDates = [];
    
    for (let i = 0; i < this.availableDays; i++) {
      const date = moment(startDate).add(i, 'day');
      const isPast = date.isBefore(today, 'day');
      const alias = date.isSame(today, 'day') ? 'Today' : date.isSame(tomorrow, 'day') ? 'Tom' : date.format('ddd');
      const dateObj: WeekDateItem = {
        alias,
        day: date.format('DD MMM'),
        fullDate: date.valueOf(),
        slotCount: null,
        status: isPast ? 'not_available' : 'loading',
        isPast
      };
      this.weekDates.push(dateObj);
      if (!isPast) {
        this.fetchSlotCount(dateObj);
      }
    }
    this.pickerValue = startDate.valueOf();
    this.hasActiveDate = this.pickerValue;
    this.selectedWeekDate = this.weekDates[0];
    this.dateSelected.emit(this.pickerValue);
    this.cdr.detectChanges();
  }

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
    const startDay = monthStart.clone().subtract(monthStart.day(), 'days').startOf('day');
    const days: any[] = [];
    const today = moment().startOf('day');

    for (let i = 0; i < 42; i++) {
      const day = startDay.clone().add(i, 'days');
      const date = day.valueOf();
      const isCurrentMonth = day.month() === monthStart.month();
      const isToday = this.isToday(date);
      const isPast = day.isBefore(today, 'day');

      days.push({
        date: isCurrentMonth ? date : null,
        isCurrentMonth,
        isToday,
        isPast,
        disabled: isPast || !isCurrentMonth
      });
    }

    return days;
  }

  changeMonth(direction: number): void {
    this.currentMonth = moment(this.currentMonth).add(direction, 'month').startOf('month').valueOf();
  }

  getSlotCountStatus(slotCount: number | null): string {
    if (slotCount === null) return 'Loading...';
    if (slotCount === 1) return '1 Available Slot';
    if (slotCount > 1) return `${slotCount} Available Slots`;
    return 'No slots';
  }

  formatDayNumber(date: number): string {
    return moment(date).format('D');
  }
}