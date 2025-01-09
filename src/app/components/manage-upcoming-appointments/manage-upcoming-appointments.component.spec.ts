import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageUpcomingAppointmentsComponent } from './manage-upcoming-appointments.component';

describe('ManageUpcomingAppointmentsComponent', () => {
  let component: ManageUpcomingAppointmentsComponent;
  let fixture: ComponentFixture<ManageUpcomingAppointmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageUpcomingAppointmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageUpcomingAppointmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
